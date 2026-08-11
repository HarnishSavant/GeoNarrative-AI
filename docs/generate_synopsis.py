import os
import markdown
import sys

def create_synopsis():
    # Paths to the generated artifact parts
    part1_path = r"C:\Users\DELL\.gemini\antigravity\brain\35f3f7db-3c7b-4749-9dc3-8da08497f937\artifacts\msc_synopsis_part1.md"
    part2_path = r"C:\Users\DELL\.gemini\antigravity\brain\35f3f7db-3c7b-4749-9dc3-8da08497f937\artifacts\msc_synopsis_part2.md"
    part3_path = r"C:\Users\DELL\.gemini\antigravity\brain\35f3f7db-3c7b-4749-9dc3-8da08497f937\artifacts\msc_synopsis_part3.md"
    
    # Output paths
    output_md = r"d:\sem3\geonarrative-ai\docs\MSc_Dissertation_Synopsis.md"
    output_html = r"d:\sem3\geonarrative-ai\docs\MSc_Dissertation_Synopsis.html"
    
    # Read parts
    try:
        with open(part1_path, "r", encoding="utf-8") as f: part1 = f.read()
        with open(part2_path, "r", encoding="utf-8") as f: part2 = f.read()
        with open(part3_path, "r", encoding="utf-8") as f: part3 = f.read()
    except FileNotFoundError as e:
        print(f"Error reading artifact parts: {e}")
        return

    # Combine content
    combined_md = f"{part1}\n\n{part2}\n\n{part3}\n"
    
    # Write combined Markdown
    os.makedirs(os.path.dirname(output_md), exist_ok=True)
    with open(output_md, "w", encoding="utf-8") as f:
        f.write(combined_md)
    print(f"✅ Successfully created combined Markdown file at: {output_md}")
    
    # Try to write HTML (which can be easily opened by MS Word)
    try:
        html_body = markdown.markdown(combined_md, extensions=['tables', 'fenced_code'])
        html_content = f"""
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Times New Roman', serif; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px; }}
                h1, h2, h3, h4 {{ color: #1e293b; }}
                table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
                th, td {{ border: 1px solid #cbd5e1; padding: 8px; text-align: left; }}
                th {{ background-color: #f1f5f9; }}
                code {{ background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; }}
                pre {{ background-color: #f1f5f9; padding: 15px; border-radius: 4px; overflow-x: auto; }}
            </style>
        </head>
        <body>
            {html_body}
        </body>
        </html>
        """
        with open(output_html, "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"✅ Successfully created HTML file for Word at: {output_html}")
        print("\n📝 TO OPEN IN WORD: Right-click the .html file -> Open with -> Microsoft Word")
        print("   Then you can go to File -> Save As -> Word Document (.docx)")
        
    except ImportError:
        print("\n⚠️ Note: The 'markdown' Python package is not installed.")
        print("To generate the HTML version (which opens natively in Word), run:")
        print("pip install markdown")
        print("Then run this script again.")

if __name__ == "__main__":
    create_synopsis()
