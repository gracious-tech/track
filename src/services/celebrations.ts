// Displays fireworks in a canvas element


/* A modified version of Gabe's work (license below)

Copyright (c) 2019 by Gabe (https://codepen.io/GabeStah/pen/BZxJmy)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/


// CONFIG

// Base firework acceleration (1 = constant speed)
const FIREWORK_ACCELERATION = 1.05

// Minimum firework brightness
const FIREWORK_BRIGHTNESS_MIN = 50

// Maximum firework brightness
const FIREWORK_BRIGHTNESS_MAX = 70

// Base speed of fireworks
const FIREWORK_SPEED = 5

// Base length of firework trails
const FIREWORK_TRAIL_LENGTH = 3

// Minimum particle brightness
const PARTICLE_BRIGHTNESS_MIN = 50

// Maximum particle brightness
const PARTICLE_BRIGHTNESS_MAX = 80

// Base particle count per firework
const PARTICLE_COUNT = 100

// Minimum particle decay rate
const PARTICLE_DECAY_MIN = 0.015

// Maximum particle decay rate
const PARTICLE_DECAY_MAX = 0.03

// Base particle friction (slows the speed of particles over time)
const PARTICLE_FRICTION = 0.95

// Base particle gravity (how quickly particles move toward a downward trajectory)
const PARTICLE_GRAVITY = 0.7

// Variance in particle coloration
const PARTICLE_HUE_VARIANCE = 20

// Base particle transparency
const PARTICLE_TRANSPARENCY = 1

// Minimum particle speed
const PARTICLE_SPEED_MIN = 1

// Maximum particle speed
const PARTICLE_SPEED_MAX = 10

// Base length of explosion particle trails
const PARTICLE_TRAIL_LENGTH = 5

// Alpha for canvas cleanup iteration to remove existing trails (lower value increases duration)
const CANVAS_CLEANUP_ALPHA = 0.15

// Minimum number of ticks between each automatic firework launch
const TICKS_PER_FIREWORK_AUTOMATED_MIN = 1

// Maximum number of ticks between each automatic firework launch
const TICKS_PER_FIREWORK_AUTOMATED_MAX = 15




let fireworks_remaining = 0


const canvas = document.createElement('canvas')

// Position over rest of app
canvas.style.display = 'none'
canvas.style.position = 'absolute'
canvas.style.top = '0'
canvas.style.left = '0'

// Allow canvas to overlay page and not affect pointer clicks etc
canvas.style.pointerEvents = 'none'

// Set the context, 2d in this case
const context = canvas.getContext('2d')


// Firework and particles collections
const fireworks = []
const particles = []
// Track number of ticks since automated firework
let ticksSinceFireworkAutomated = 0

// === END LOCAL VARS ===

// === HELPERS ===

// Get a random number within the specified range
function random(min, max) {
    return Math.random() * (max - min) + min
}

// Calculate the distance between two points
function calculateDistance(aX, aY, bX, bY) {
    const xDistance = aX - bX
    const yDistance = aY - bY
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2))
}


// Creates a new firework
// Path begins at 'start' point and ends and 'end' point
function Firework(startX, startY, endX, endY) {
    // Set current coordinates
    this.x = startX
    this.y = startY
    // Set starting coordinates
    this.startX = startX
    this.startY = startY
    // Set end coordinates
    this.endX = endX
    this.endY = endY
    // Get the distance to the end point
    this.distanceToEnd = calculateDistance(startX, startY, endX, endY)
    this.distanceTraveled = 0
    // Create an array to track current trail particles
    this.trail = []
    // Trail length determines how many trailing particles are active at once
    this.trailLength = FIREWORK_TRAIL_LENGTH
    // While the trail length remains, add current point to trail list
    while(this.trailLength--) {
        this.trail.push([this.x, this.y])
    }
    // Calculate the angle to travel from start to end point
    this.angle = Math.atan2(endY - startY, endX - startX)
    // Set the speed
    this.speed = FIREWORK_SPEED
    // Set the acceleration
    this.acceleration = FIREWORK_ACCELERATION
    // Set the brightness
    this.brightness = random(FIREWORK_BRIGHTNESS_MIN, FIREWORK_BRIGHTNESS_MAX)
    // Set the radius of click-target location
    this.targetRadius = 2.5
    // Set a random hue
    this.hue = random(0, 360)
}

// Update a firework prototype
// 'index' parameter is index in 'fireworks' array to remove, if journey is complete
Firework.prototype.update = function(index) {
    // Remove the oldest trail particle
    this.trail.pop()
    // Add the current position to the start of trail
    this.trail.unshift([this.x, this.y])

    // Increase speed based on acceleration rate
    this.speed *= this.acceleration

    // Calculate current velocity for both x and y axes
    const xVelocity = Math.cos(this.angle) * this.speed
    const yVelocity = Math.sin(this.angle) * this.speed
    // Calculate current distance travelled based on starting, current, and velocity
    // This can be used to determine if firework has reached final position
    this.distanceTraveled = calculateDistance(
        this.startX, this.startY, this.x + xVelocity, this.y + yVelocity)

    // Check if final position has been reached (or exceeded)
    if(this.distanceTraveled >= this.distanceToEnd) {
        // Destroy firework by removing it from collection
        fireworks.splice(index, 1)
        // Create particle explosion at end point.  Important not to use this.x and this.y,
        // since that position is always one animation loop behind
        createParticles(this.endX, this.endY, this.hue)
    } else {
        // End position hasn't been reached, so continue along current trajectory
        this.x += xVelocity
        this.y += yVelocity
    }
}

// Draw a firework
// Use CanvasRenderingContext2D methods to create strokes as firework paths
Firework.prototype.draw = function() {
    // Begin a new path for firework trail
    context.beginPath()
    // Get the coordinates for the oldest trail position
    const trailEndX = this.trail[this.trail.length - 1][0]
    const trailEndY = this.trail[this.trail.length - 1][1]
    // Create a trail stroke from trail end position to current firework position
    context.moveTo(trailEndX, trailEndY)
    context.lineTo(this.x, this.y)
    // Set stroke coloration and style
    // Use hue, saturation, and light values instead of RGB
    context.strokeStyle = `hsl(${this.hue}, 100%, ${this.brightness}%)`
    // Draw stroke
    context.stroke()
}

// Creates a new particle at provided 'x' and 'y' coordinates
function Particle(x, y, hue) {
    // Set current position
    this.x = x
    this.y = y
    // To better simulate a firework, set the angle of travel to random value in any direction
    this.angle = random(0, Math.PI * 2)
    // Set friction
    this.friction = PARTICLE_FRICTION
    // Set gravity
    this.gravity = PARTICLE_GRAVITY
    // Set the hue to somewhat randomized number close to the original firework's hue
    // This gives the particles within a firework explosion an appealing variance
    this.hue = random(hue - PARTICLE_HUE_VARIANCE, hue + PARTICLE_HUE_VARIANCE)
    // Set brightness
    this.brightness = random(PARTICLE_BRIGHTNESS_MIN, PARTICLE_BRIGHTNESS_MAX)
    // Set decay
    this.decay = random(PARTICLE_DECAY_MIN, PARTICLE_DECAY_MAX)
    // Set speed
    this.speed = random(PARTICLE_SPEED_MIN, PARTICLE_SPEED_MAX)
    // Create an array to track current trail particles
    this.trail = []
    // Trail length determines how many trailing particles are active at once
    this.trailLength = PARTICLE_TRAIL_LENGTH
    // While the trail length remains, add current point to trail list
    while(this.trailLength--) {
        this.trail.push([this.x, this.y])
    }
    // Set transparency
    this.transparency = PARTICLE_TRANSPARENCY
}

// Update a particle prototype
// 'index' parameter is index in 'particles' array to remove, if journey is complete
Particle.prototype.update = function(index) {
    // Remove the oldest trail particle
    this.trail.pop()
    // Add the current position to the start of trail
    this.trail.unshift([this.x, this.y])

    // Decrease speed based on friction rate
    this.speed *= this.friction
    // Calculate current position based on angle, speed, and gravity (for y-axis only)
    this.x += Math.cos(this.angle) * this.speed
    this.y += Math.sin(this.angle) * this.speed + this.gravity

    // Apply transparency based on decay
    this.transparency -= this.decay
    // Use decay rate to determine if particle should be destroyed
    if(this.transparency <= this.decay) {
        // Destroy particle once transparency level is below decay
        particles.splice(index, 1)
    }
}

// Draw a particle
// Use CanvasRenderingContext2D methods to create strokes as particle paths
Particle.prototype.draw = function() {
    // Begin a new path for particle trail
    context.beginPath()
    // Get the coordinates for the oldest trail position
    const trailEndX = this.trail[this.trail.length - 1][0]
    const trailEndY = this.trail[this.trail.length - 1][1]
    // Create a trail stroke from trail end position to current particle position
    context.moveTo(trailEndX, trailEndY)
    context.lineTo(this.x, this.y)
    // Set stroke coloration and style
    // Use hue, brightness, and transparency instead of RGBA
    context.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.transparency})`
    context.stroke()
}

// === END PROTOTYPING ===

// === APP HELPERS ===

// Cleans up the canvas by removing older trails
//
// In order to smoothly transition trails off the canvas, and to make them
// appear more realistic, we're using a composite fill
// Set the initial composite mode to 'destination-out' to keep content that
// overlap with the fill we're adding
//
function cleanCanvas() {
    // Set 'destination-out' composite mode, so more fill doesn't remove non-overlapping content
    context.globalCompositeOperation = 'destination-out'
    // Set alpha level of content to remove
    // Lower value means trails remain on screen longer
    context.fillStyle = `rgba(0, 0, 0, ${CANVAS_CLEANUP_ALPHA})`
    // Fill entire canvas
    context.fillRect(0, 0, canvas.width, canvas.height)
    // Reset composite mode to 'lighter', so overlapping particles brighten each other
    context.globalCompositeOperation = 'lighter'
}

// Create particle explosion at 'x' and 'y' coordinates
function createParticles(x, y, hue) {
    // Set particle count
    // Higher numbers may reduce performance
    let particleCount = PARTICLE_COUNT
    while(particleCount--) {
        // Create a new particle and add it to particles collection
        particles.push(new Particle(x, y, hue))
    }
}

// Launch fireworks automatically
function launchAutomatedFirework() {
    // Determine if ticks since last automated launch is greater than random min/max values
    if(fireworks_remaining && ticksSinceFireworkAutomated >= random(
            TICKS_PER_FIREWORK_AUTOMATED_MIN, TICKS_PER_FIREWORK_AUTOMATED_MAX)) {
        fireworks_remaining -= 1
        // Set start position to bottom center
        const startX = canvas.width / 2
        const startY = canvas.height
        // Set end position to random position, somewhere in the top half of screen
        const endX = random(0, canvas.width)
        const endY = random(0, canvas.height / 2)
        // Create new firework and add to collection
        fireworks.push(new Firework(startX, startY, endX, endY))
        // Reset tick counter
        ticksSinceFireworkAutomated = 0
    } else {
        // Increment counter
        ticksSinceFireworkAutomated++
    }
}

// Update all active fireworks
function updateFireworks() {
    // Loop backwards through all fireworks, drawing and updating each
    for (let i = fireworks.length - 1; i >= 0; --i) {
        fireworks[i].draw()
        fireworks[i].update(i)
    }
}

// Update all active particles
function updateParticles() {
    // Loop backwards through all particles, drawing and updating each
    for (let i = particles.length - 1; i >= 0; --i) {
        particles[i].draw()
        particles[i].update(i)
    }
}

// === END APP HELPERS ===

// Primary loop
function loop(){

    if (! fireworks_remaining && ! particles.length && ! fireworks.length){
        requestAnimationFrame(() => {
            canvas.style.display = 'none'
        })
        return
    }

    // Smoothly request animation frame for each loop iteration
    requestAnimationFrame(loop)

    // Clean the canvas
    cleanCanvas()

    // Update fireworks
    updateFireworks()

    // Update particles
    updateParticles()

    // Launch automated fireworks
    launchAutomatedFirework()
}


export class Celebrations {

    constructor(){
        // Attach to DOM
        document.body.appendChild(canvas)
    }

    celebrate(intensity){
        // Intensity is expected to be between 1-150

        // Amount of fireworks proportional to intensity but not same amount (would go for too long)
        const intensity_to_num = [
            // NOTE Psalms is 150, but next closest is only 66 (Isaiah)
            [0, 1],
            [2, 2],
            [4, 3],
            [6, 4],
            [10, 5],
            [15, 6],
            [20, 7],
            [30, 8],
            [40, 10],
            [50, 12],
            [66, 15],
            [150, 25],
        ]

        // Get the amount of fireworks based on intensity
        let amount = 0
        for (const [tier, num] of intensity_to_num){
            if (intensity >= tier){
                amount = num
            } else {
                break
            }
        }

        // Show the canvas and run loop until done
        // NOTE Important to set dimensions each time in case orientation has changed
        // WARN This is separate to styling which will stretch the canvas rather than resize it
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        canvas.style.display = 'block'
        fireworks_remaining += amount
        loop()
    }
}
