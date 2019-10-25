""" An implementation of AppPuzzle in Python

This is kept as close as possible to the Typescript so that any changes to it can be easily also
made to this module.

"""

class Puzzle:

    total_chapters = 1189  # Protestant Bible chapters count (confirmed with data)
    row_length = 41  # Results in 29 columns (the only possible numbers to divide 1189 by)
    piece_size = 10  # SVG width/height
    piece_left = 'v3.5a1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1 -1.5 1.5v3.5'
    piece_bottom = 'h3.5a1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5 -1.5h3.5'
    piece_right = 'v-3.5a1.5 1.5 0 0 0 1.5 -1.5 1.5 1.5 0 0 0 -1.5 -1.5v-3.5'
    piece_top = 'h-3.5a1.5 1.5 0 0 1 -1.5 1.5 1.5 1.5 0 0 1 -1.5 -1.5h-3.5z'

    def __init__(self, done):
        self.done = done  # Array of bools for chapters

    def template(self):
        out = f"<svg viewBox='{self.viewbox()}'>"
        for piece, show in self.pieces():
            attrs = "fill='#424242' stroke='#424242'"
            if show:
                # NOTE stroke-opacity double (0.1) as lines harder to see in compressed image
                attrs = "fill='transparent' stroke='#000000' stroke-opacity='0.2'"
            out += f"<path d='{piece}' {attrs} />"
        return out + "</svg>"

    def viewbox(self):
        width = self.row_length * self.piece_size
        height = self.total_chapters / self.row_length * self.piece_size
        return f"0 0 {width} {height}"

    def pieces(self):
        # Return list of SVG d values that form puzzle pieces

        # Generate pieces list
        pieces = []
        for i, show in enumerate(self.done):

            # Work out position for the piece
            x = i % self.row_length * self.piece_size
            y = i // self.row_length * self.piece_size

            # Give pieces on border straight edges (right/bottom don't matter as extrude only)
            left = f'v{self.piece_size}' if x == 0 else self.piece_left
            top = f'h{self.piece_size}' if y == 0 else self.piece_top

            # Form the d value for the piece and add to list
            # WARN order of the edges is important
            piece = f"m {x} {y} {left} {self.piece_bottom} {self.piece_right} {top}"
            pieces.append([piece, show])

        return pieces
