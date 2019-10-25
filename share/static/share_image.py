
import json
from io import BytesIO
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFont

from i18n import get_strings
from AppPuzzle import Puzzle


APP_CONFIG = json.loads(Path('app_config.json').read_text())


class ShareImage:

    def __init__(self, puzzle_id, chapters, recent_book, current_book, bible_version, locale):

        # Get book names
        version_data_path = Path(f"versions/{bible_version}.json")
        book_names = json.loads(version_data_path.read_text())['book_names']

        # Set input properties
        self.puzzle_id = puzzle_id
        self.chapters = chapters
        self.recent_book_name = book_names[recent_book] if recent_book else None
        self.current_book_name = book_names[current_book] if current_book else None

        # Select i18n strings based on locale
        self.i18n = get_strings(locale)

        # Size settings
        # See https://developers.facebook.com/docs/sharing/best-practices#images
        width_ratio = 1.91  # Ratio Facebook uses for link images
        size_multiplier = 30  # 30 results in 1230*870
        self.puzzle_width = 41 * size_multiplier
        self.puzzle_height = 29 * size_multiplier
        self.out_height = self.puzzle_height
        self.out_width = int(self.puzzle_height * width_ratio)

        # Load fonts and init text layer
        self.text = Image.new('RGBA', (self.out_width, self.out_height), None)
        self.draw = ImageDraw.Draw(self.text)
        self.font_regular = ImageFont.truetype('NotoSans-Condensed.ttf', 50)
        self.font_strong = ImageFont.truetype('NotoSans-CondensedMedium.ttf', 45)
        self.next_sidebar_y = 230

    def draw_sidebar_text(self, chars, y, strong=False):
        """ Helper for drawing text in the sidebar """
        font = self.font_strong if strong else self.font_regular

        # Reduce chars if needed until text fits within sidebar
        # NOTE This is intended for book names in other locales that will be impossible to check all
        while True:
            x = self.sidebar_center_x(font.getsize(chars)[0])
            if x > self.puzzle_width + 10:
                break
            chars = chars.strip('…')[:-1] + '…'

        # Add the text
        self.draw.text([x, y], chars, '#fff' if strong else '#fffc', font)

    def draw_sidebar_item(self, heading, value):
        """ Draw sidebar item with a heading and value beneath in correct position """
        self.draw_sidebar_text(heading, self.next_sidebar_y, True)
        self.draw_sidebar_text(value, self.next_sidebar_y + 70)
        self.next_sidebar_y += 200

    def sidebar_center_x(self, object_width):
        """ Get x position for centering an object in the sidebar """
        return self.puzzle_width + (self.out_width - self.puzzle_width - object_width) // 2

    def generate(self):
        """ Generate the image to share and return it """

        # Create empty image with correct dimensions
        out = Image.new('RGB', (self.out_width, self.out_height), APP_CONFIG['theme']['primary'])

        # Paste photo in
        out.paste(Image.open(f'puzzles/{self.puzzle_id}.jpg'))

        # Paste svg in
        svg = Puzzle(self.chapters).template()
        svg_as_png = cairosvg.svg2png(bytestring=svg, parent_width=self.puzzle_width,
            parent_height=self.puzzle_height)
        svg_as_png = Image.open(BytesIO(svg_as_png))
        # WARN Exception raised if mask has no transparent areas (occurs when no progress)
        mask = svg_as_png if any(self.chapters) else None
        out.paste(svg_as_png, mask=mask)

        # Paste in branding
        branding = Image.open('branding.png')
        out.paste(branding, [self.sidebar_center_x(branding.width), 40])

        # Write progress text
        percent = int(self.chapters.count(True) / len(self.chapters) * 100)
        self.draw_sidebar_item(self.i18n['percent_heading'], f"{percent}%")

        # Write recent/current books if given
        if self.recent_book_name:
            self.draw_sidebar_item(self.i18n['recently_heading'], self.recent_book_name)
        if self.current_book_name:
            self.draw_sidebar_item(self.i18n['currently_heading'], self.current_book_name)

        # Paste in text layer
        out.paste(self.text, mask=self.text)

        # Return jpeg bytes and dimensions
        virtual_file = BytesIO()
        out.save(virtual_file, 'JPEG', quality=90)
        return (virtual_file.getvalue(), out.width, out.height)
