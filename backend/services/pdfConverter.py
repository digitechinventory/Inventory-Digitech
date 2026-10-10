import sys
import json
import base64
import os
import warnings

# Suppress PyMuPDF deprecation warnings
warnings.filterwarnings("ignore")

try:
    import pymupdf as fitz
except ImportError:
    import fitz

def convert_pdf_to_images(pdf_path_or_data, max_pages=10, dpi=150):
    try:
        if os.path.exists(pdf_path_or_data):
            doc = fitz.open(pdf_path_or_data)
        else:
            # Assume base64 encoded string
            # strip data url header if present
            raw = pdf_path_or_data
            if ',' in raw and 'base64' in raw[:50]:
                raw = raw.split(',', 1)[1]
            pdf_bytes = base64.b64decode(raw)
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        pages = []
        num_pages = min(len(doc), max_pages)
        overall_orientation = 'landscape'

        for i in range(num_pages):
            page = doc[i]
            rect = page.rect
            is_landscape = rect.width > rect.height
            if i == 0:
                overall_orientation = 'landscape' if is_landscape else 'portrait'

            pix = page.get_pixmap(dpi=dpi)
            png_bytes = pix.tobytes("png")
            b64_png = "data:image/png;base64," + base64.b64encode(png_bytes).decode("utf-8")

            pages.append({
                "page_index": i,
                "width": pix.width,
                "height": pix.height,
                "is_landscape": is_landscape,
                "image_data": b64_png
            })

        total_pages = len(doc)
        doc.close()
        return {
            "success": True,
            "total_pages": total_pages,
            "converted_pages": len(pages),
            "orientation": overall_orientation,
            "pages": pages
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No input provided"}))
        sys.exit(1)

    input_arg = sys.argv[1]
    res = convert_pdf_to_images(input_arg)
    print(json.dumps(res))
