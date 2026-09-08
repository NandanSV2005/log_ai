import os
import sys
from pathlib import Path
from fpdf import FPDF

class PDFReport(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(100, 110, 120)
        self.cell(0, 8, 'LOG AI -- Technical Implementation & Hackathon Presentation Report', border=0, align='L')
        self.cell(0, 8, 'CONFIDENTIAL / HACKATHON GUIDE', border=0, align='R')
        self.ln(10)
        self.set_draw_color(200, 205, 215)
        self.line(10, 18, 200, 18)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(120, 130, 140)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}} | LOG AI v2.4.0 Sovereign Security Platform', align='C')

def sanitize_ascii(text: str) -> str:
    """Replaces non-latin-1 unicode characters with ASCII equivalents for FPDF."""
    replacements = {
        '—': '--',
        '–': '-',
        '→': '->',
        '←': '<-',
        '↑': '^',
        '↓': 'v',
        '●': '*',
        '•': '*',
        '≥': '>=',
        '≤': '<=',
        '±': '+/-',
        '≈': '~',
        '≠': '!=',
        '💡': '[INFO]',
        '✅': '[OK]',
        '⚠️': '[WARN]',
        '©': '(c)',
    }
    for orig, repl in replacements.items():
        text = text.replace(orig, repl)
    return text.encode('latin-1', 'replace').decode('latin-1')

def create_pdf(md_filepath: Path, pdf_filepath: Path):
    pdf = PDFReport()
    pdf.alias_nb_pages()
    pdf.set_margins(10, 20, 10)
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    
    with open(md_filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(30, 35, 45)

    in_code_block = False
    usable_width = 190.0

    for line in lines:
        raw_line = sanitize_ascii(line.rstrip('\n'))
        stripped = raw_line.strip()

        if stripped.startswith('```'):
            in_code_block = not in_code_block
            if in_code_block:
                pdf.ln(2)
                pdf.set_fill_color(240, 243, 248)
                pdf.set_font('Courier', '', 8)
            else:
                pdf.set_font('Helvetica', '', 10)
                pdf.ln(2)
            continue

        if in_code_block:
            pdf.set_fill_color(242, 244, 248)
            pdf.set_text_color(40, 50, 60)
            # Truncate overly long code lines to prevent wrap crashes in PDF
            chunk = raw_line[:110]
            pdf.multi_cell(usable_width, 4.5, chunk, fill=True)
            continue

        if stripped.startswith('# '):
            pdf.ln(4)
            pdf.set_font('Helvetica', 'B', 15)
            pdf.set_text_color(15, 23, 42)
            pdf.multi_cell(usable_width, 7.5, stripped[2:])
            pdf.set_font('Helvetica', '', 10)
            pdf.set_text_color(30, 35, 45)
            pdf.ln(2)
        elif stripped.startswith('## '):
            pdf.ln(3)
            pdf.set_font('Helvetica', 'B', 12)
            pdf.set_text_color(30, 41, 59)
            pdf.multi_cell(usable_width, 6, stripped[3:])
            pdf.set_font('Helvetica', '', 10)
            pdf.set_text_color(30, 35, 45)
            pdf.ln(1)
        elif stripped.startswith('### '):
            pdf.ln(2)
            pdf.set_font('Helvetica', 'B', 10.5)
            pdf.set_text_color(71, 85, 105)
            pdf.multi_cell(usable_width, 5.5, stripped[4:])
            pdf.set_font('Helvetica', '', 10)
            pdf.set_text_color(30, 35, 45)
            pdf.ln(1)
        elif stripped.startswith('- ') or stripped.startswith('* '):
            pdf.set_font('Helvetica', '', 9.5)
            pdf.set_text_color(30, 35, 45)
            pdf.multi_cell(usable_width, 5, f"  * {stripped[2:]}")
        elif stripped.startswith(('1. ', '2. ', '3. ', '4. ', '5. ', '6. ', '7. ', '8. ', '9. ')):
            pdf.set_font('Helvetica', '', 9.5)
            pdf.set_text_color(30, 35, 45)
            pdf.multi_cell(usable_width, 5, f"  {stripped}")
        elif stripped == '---':
            pdf.ln(2)
            pdf.set_draw_color(220, 225, 235)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(3)
        elif not stripped:
            pdf.ln(2)
        else:
            clean_text = raw_line.replace('**', '').replace('*', '').replace('`', '')
            pdf.set_font('Helvetica', '', 9.5)
            pdf.set_text_color(30, 35, 45)
            pdf.multi_cell(usable_width, 5, clean_text)

    pdf.output(str(pdf_filepath))
    print(f"Successfully generated PDF report at: {pdf_filepath}")

if __name__ == '__main__':
    root_dir = Path(__file__).parent.parent
    md_path = root_dir / "PROJECT_IMPLEMENTATION_AND_PRESENTATION_REPORT.md"
    pdf_path = root_dir / "PROJECT_IMPLEMENTATION_AND_PRESENTATION_REPORT.pdf"
    create_pdf(md_path, pdf_path)
