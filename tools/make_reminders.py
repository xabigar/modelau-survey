"""Builds the visual reminders of the questionnaire (crops of the demonstration frames with a red box) into public/img.
Run from modelau_survey:  python3 tools/make_reminders.py   (needs Pillow). Source: ../modelau_latex/evaluation/demo."""
import pathlib
from PIL import Image, ImageDraw

SRC = pathlib.Path('../modelau_latex/evaluation/demo'); OUT = pathlib.Path('public/img'); OUT.mkdir(parents=True, exist_ok=True)
RED = (230, 40, 60)

def crop(name, src, box, marks=(), width=760):
    im = Image.open(SRC / src).convert('RGB').crop(box)
    k = width / im.width
    im = im.resize((width, round(im.height * k)), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for (x1, y1, x2, y2) in marks:
        for i in range(4):
            d.rectangle((x1 * k - i, y1 * k - i, x2 * k + i, y2 * k + i), outline=RED)
    im.save(OUT / name, optimize=True)

# marks are in the coordinates of the crop (source pixels)
crop('cite.png', 'frames/07_tutor_reply.png', (1120, 300, 1500, 540), [(15, 172, 340, 195)])
crop('highlight.png', 'frames/08_highlight_in_diagram.png', (0, 310, 780, 790), [(12, 16, 297, 174), (12, 326, 297, 466)], 760)
crop('single.png', 'frames/07_tutor_reply.png', (1120, 250, 1500, 540), [(15, 105, 370, 250)])
crop('nudge.png', 'frames/02_idle_nudge.png', (1000, 770, 1500, 950), [(130, 72, 484, 164)])
crop('edit.png', 'frames/04_structural_check.png', (0, 800, 420, 950), [(16, 40, 396, 115)], 700)
crop('step.png', 'frames/01_exercise_and_first_class.png', (0, 200, 420, 300), [(97, 40, 396, 67)], 700)
crop('vocab.png', 'frames/10_vocabulary.png', (776, 440, 1126, 580), [(12, 40, 330, 120)], 700)
crop('integrated.png', 'frames/05_assistant_open.png', (0, 80, 1500, 950), [], 900)
crop('a_modelau.png', 'frames/07_tutor_reply.png', (1120, 250, 1500, 540), [], 520)
crop('a_chat.png', 'frames/09_conventional_chat_en.png', (0, 0, 1500, 760), [], 760)
Image.open(SRC / 'cards/es/08_sequence_card.png').convert('RGB').crop((0, 0, 1500, 760)).resize((900, 456), Image.LANCZOS).save(OUT / 'scenario.png', optimize=True)
print('wrote', len(list(OUT.glob('*.png'))), 'images to', OUT)
