"""Generate the editable sample PDF library for Rafis Sprachwelt."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1] / "assets" / "pdfs"
LEVELS = {
    "a1": ("Foundation", "short everyday sentences"),
    "a2": ("Elementary", "connected everyday communication"),
    "b1": ("Intermediate", "independent communication and clear opinions"),
    "b2": ("Upper Intermediate", "precise, nuanced and professional communication"),
}
CATEGORIES = {
    "grammar": [
        ("grammar-reference", "Grammar Reference", "Core rules, structures and examples"),
        ("verb-and-sentence-guide", "Verb and Sentence Guide", "Verb forms, position and sentence patterns"),
        ("grammar-quick-review", "Grammar Quick Review", "A compact revision checklist"),
    ],
    "vocabulary": [
        ("everyday-vocabulary", "Everyday Vocabulary", "High-value words for daily communication"),
        ("topic-word-list", "Topic Word List", "Organized vocabulary with English meanings"),
        ("useful-expressions", "Useful Expressions", "Natural phrases for common situations"),
    ],
    "worksheets": [
        ("grammar-worksheet", "Grammar Worksheet", "Printable grammar tasks with an answer key"),
        ("reading-worksheet", "Reading Worksheet", "A graded text and comprehension questions"),
        ("mixed-practice", "Mixed Practice Worksheet", "Grammar, vocabulary and writing practice"),
    ],
    "flashcards": [
        ("daily-life-flashcards", "Daily Life Flashcards", "Cut-out cards for everyday vocabulary"),
        ("verbs-flashcards", "Verb Flashcards", "Useful verbs and sentence prompts"),
        ("expressions-flashcards", "Expression Flashcards", "Reusable speaking expressions"),
    ],
}

ACCENT = colors.HexColor("#2563EB")
NAVY = colors.HexColor("#112B5F")
PALE = colors.HexColor("#EEF5FF")

def make_pdf(level, category, filename, title, subtitle):
    output = ROOT / level / category / f"{filename}.pdf"
    output.parent.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Brand", parent=styles["Normal"], textColor=ACCENT, fontSize=9, leading=12, alignment=TA_CENTER, spaceAfter=5))
    styles.add(ParagraphStyle(name="TitleX", parent=styles["Title"], textColor=NAVY, fontSize=24, leading=29, alignment=TA_CENTER, spaceAfter=9))
    styles.add(ParagraphStyle(name="Intro", parent=styles["BodyText"], textColor=colors.HexColor("#53627A"), fontSize=10, leading=16, alignment=TA_CENTER, spaceAfter=18))
    styles.add(ParagraphStyle(name="Head", parent=styles["Heading2"], textColor=NAVY, fontSize=14, leading=18, spaceBefore=10, spaceAfter=8))
    styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], textColor=colors.HexColor("#53627A"), fontSize=8.5, leading=13))
    band, ability = LEVELS[level]
    doc = SimpleDocTemplate(str(output), pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=18*mm, bottomMargin=18*mm,
                            title=f"Rafis Sprachwelt {level.upper()} - {title}", author="Rafis Sprachwelt")
    story = [Paragraph("RAFIS SPRACHWELT - STUDY RESOURCES", styles["Brand"]), Paragraph(f"{level.upper()} {title}", styles["TitleX"]), Paragraph(f"{subtitle}. Sample material for {band.lower()} learners developing {ability}.", styles["Intro"])]
    if category == "grammar":
        rows = [["Pattern", "Example", "Remember"], ["Verb in position 2", "Heute lerne ich Deutsch.", "The first element may change."], ["Connector + clause", "Ich lerne, weil es wichtig ist.", "Check the final verb position."], ["Time - manner - place", "Wir fahren morgen mit dem Bus nach Bonn.", "Use this as a helpful default."]]
        story += [Paragraph("Core patterns", styles["Head"]), styled_table(rows), Paragraph("Practice: Rewrite each example with a new subject and time expression. Then underline the conjugated verb.", styles["Small"])]
    elif category == "vocabulary":
        rows = [["German", "English", "Example"], ["die Erfahrung", "experience", "Das war eine gute Erfahrung."], ["sich vorbereiten", "to prepare", "Ich bereite mich auf den Kurs vor."], ["zuverlaessig", "reliable", "Sie ist sehr zuverlaessig."], ["die Moeglichkeit", "possibility", "Wir haben mehrere Moeglichkeiten."]]
        story += [Paragraph("Words in context", styles["Head"]), styled_table(rows), Paragraph("Study method: Cover the English column, recall the meaning, and create one personal sentence for every word.", styles["Small"])]
    elif category == "worksheets":
        story += [Paragraph("Tasks", styles["Head"]), Paragraph("1. Complete: Heute ___ ich meine Hausaufgaben. (machen)<br/>2. Choose: Ich fahre mit ___ Bus. (der / dem / den)<br/>3. Reorder: weil / lernt / Deutsch / er / arbeitet / Deutschland / in / er<br/>4. Write three sentences about your weekly routine.<br/>5. Write one polite question for a teacher.", styles["Small"]), Spacer(1, 12*mm), Paragraph("Answer key", styles["Head"]), Paragraph("1. mache &nbsp;&nbsp; 2. dem &nbsp;&nbsp; 3. Er lernt Deutsch, weil er in Deutschland arbeitet. Tasks 4 and 5 have individual answers.", styles["Small"])]
    else:
        rows = [["FRONT", "BACK / PROMPT"], ["sich entscheiden", "to decide - Wofuer entscheidest du dich?"], ["die Meinung", "opinion - Meiner Meinung nach ..."], ["vereinbaren", "to arrange - einen Termin vereinbaren"], ["trotzdem", "nevertheless - Connect two contrasting ideas."], ["die Loesung", "solution - eine Loesung finden"]]
        story += [Paragraph("Print and cut along the rows", styles["Head"]), styled_table(rows), Paragraph("Tip: Say the answer before turning the card. Repeat difficult cards on the next day.", styles["Small"])]
    story += [Spacer(1, 14*mm), Paragraph(f"Sample resource - {level.upper()} - Edit or replace this PDF when your final course material is ready.", styles["Small"])]
    doc.build(story, onFirstPage=footer, onLaterPages=footer)

def styled_table(rows):
    cell_style = ParagraphStyle("TableCell", fontName="Helvetica", fontSize=8, leading=10, textColor=colors.HexColor("#35445D"))
    head_style = ParagraphStyle("TableHead", parent=cell_style, fontName="Helvetica-Bold", textColor=colors.white)
    wrapped = [[Paragraph(str(value), head_style if row_index == 0 else cell_style) for value in row] for row_index, row in enumerate(rows)]
    table = Table(wrapped, colWidths=[48*mm, 48*mm, 58*mm], repeatRows=1)
    table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),NAVY),("TEXTCOLOR",(0,0),(-1,0),colors.white),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),8),("LEADING",(0,0),(-1,-1),11),("BACKGROUND",(0,1),(-1,-1),PALE),("TEXTCOLOR",(0,1),(-1,-1),colors.HexColor("#35445D")),("GRID",(0,0),(-1,-1),.5,colors.HexColor("#C8D8F0")),("VALIGN",(0,0),(-1,-1),"TOP"),("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7),("LEFTPADDING",(0,0),(-1,-1),7)]))
    return table

def footer(canvas, doc):
    canvas.saveState(); canvas.setStrokeColor(colors.HexColor("#D7E3F5")); canvas.line(20*mm,14*mm,190*mm,14*mm)
    canvas.setFont("Helvetica",7); canvas.setFillColor(colors.HexColor("#71809A")); canvas.drawString(20*mm,9*mm,"Rafis Sprachwelt - German learning resources"); canvas.drawRightString(190*mm,9*mm,f"Page {doc.page}"); canvas.restoreState()

if __name__ == "__main__":
    for level in LEVELS:
        for category, documents in CATEGORIES.items():
            for filename, title, subtitle in documents:
                make_pdf(level, category, filename, title, subtitle)
    print(f"Generated {sum(1 for _ in ROOT.rglob('*.pdf'))} PDFs in {ROOT}")
