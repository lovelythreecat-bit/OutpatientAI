from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
shots = root / 'screenshots'
font = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 26)
small = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 17)
canvas = Image.new('RGB', (2000, 1650), '#f5f6f2')
draw = ImageDraw.Draw(canvas)
draw.text((36, 25), '智慧医疗 / 在线咨询原型', font=font, fill='#173e38')
draw.text((36, 68), '长期沟通 · AI 转人工 · 从对话沉淀知识', font=small, fill='#5c7066')
items = [('AI 问诊 · 转人工入口', '02-ai-handoff.png'), ('患者端 · 长期聊天', '01-patient.png'), ('医生端 · 选择对话内容', '05-doctor-selection.png'), ('知识确认 · 直接编辑文章', '06-knowledge-review.png')]
for i, (title, name) in enumerate(items):
    x = 36 + (i % 2) * 988
    y = 125 + (i // 2) * 757
    draw.text((x, y), title, font=font, fill='#253d37')
    im = Image.open(shots / name).convert('RGB')
    im.thumbnail((952, 688), Image.Resampling.LANCZOS)
    canvas.paste(im, (x, y + 45))
canvas.save(shots / 'overview.png')
print(shots / 'overview.png')
