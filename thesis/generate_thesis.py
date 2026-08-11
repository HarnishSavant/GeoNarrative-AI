"""
GeoNarrative AI - MSc Thesis Generator
Run this script to generate the complete thesis .docx file.
Usage: cd thesis && python generate_thesis.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from doc_setup import create_document, add_page_break
from frontmatter import (add_title_page, add_certificate, add_declaration,
                         add_acknowledgement, add_abstract, add_toc_placeholder,
                         add_list_of_figures, add_list_of_tables, add_abbreviations)
from ch1_introduction import write_chapter_1
from ch2_literature import write_chapter_2
from ch3_study_area import write_chapter_3
from ch4_methodology import write_chapter_4
from ch5_implementation import write_chapter_5
from ch6_results import write_chapter_6
from ch7_conclusion import write_chapter_7, write_references

OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "GeoNarrative_AI_MSc_Thesis_FINAL.docx")

def main():
    print("=" * 60)
    print("  GeoNarrative AI - FINAL MSc Thesis Generator")
    print("=" * 60)
    
    print("[1/10] Creating document with formatting...")
    doc = create_document()
    
    print("[2/10] Adding frontmatter...")
    add_title_page(doc)
    add_certificate(doc)
    add_declaration(doc)
    add_acknowledgement(doc)
    add_abstract(doc)
    add_toc_placeholder(doc)
    add_list_of_figures(doc)
    add_list_of_tables(doc)
    add_abbreviations(doc)
    
    print("[3/10] Writing Chapter 1: Introduction...")
    write_chapter_1(doc)
    
    print("[4/10] Writing Chapter 2: Literature Review...")
    write_chapter_2(doc)
    
    print("[5/10] Writing Chapter 3: Study Area...")
    write_chapter_3(doc)
    
    print("[6/10] Writing Chapter 4: Methodology...")
    write_chapter_4(doc)
    
    print("[7/10] Writing Chapter 5: Implementation...")
    write_chapter_5(doc)
    
    print("[8/10] Writing Chapter 6: Results and Discussion...")
    write_chapter_6(doc)
    
    print("[9/10] Writing Chapter 7: Conclusion...")
    write_chapter_7(doc)
    
    print("[9.5/10] Writing References...")
    write_references(doc)
    
    print("[10/10] Saving document...")
    doc.save(OUTPUT_FILE)
    
    print()
    print("=" * 60)
    print(f"  THESIS GENERATED SUCCESSFULLY!")
    print(f"  Output: {os.path.abspath(OUTPUT_FILE)}")
    print("=" * 60)
    print()
    print("Next steps:")
    print("  1. Open the .docx in Microsoft Word")
    print("  2. Generate Table of Contents (References > Table of Contents)")
    print("  3. Generate List of Figures (References > Insert Table of Figures)")
    print("  4. Replace screenshot placeholders with actual screenshots")
    print("  5. Render Mermaid diagrams at mermaid.live and paste as images")
    print("  6. Fill in [bracketed] personal details")
    print("  7. Review and adjust page numbers")

if __name__ == "__main__":
    main()
