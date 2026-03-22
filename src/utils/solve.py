import sys
import os

try:
    import ddddocr
except ModuleNotFoundError:
    print("ERROR_MISSING_DEPENDENCY", flush=True)
    sys.exit(1)

def solve_captcha(img_path):
    try:
        # Initialize ddddocr (disabling the ad/welcome message)
        ocr = ddddocr.DdddOcr(show_ad=False)
        with open(img_path, 'rb') as f:
            img_bytes = f.read()
            
        if not img_bytes:
            print("ERROR_EMPTY_IMAGE", flush=True)
            sys.exit(1)
            
        res = ocr.classification(img_bytes)
        print(f"SUCCESS:{res}", flush=True)
        sys.exit(0)
    except Exception as e:
        print(f"ERROR_PROCESSING:{str(e)}", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("ERROR_NO_IMAGE_PROVIDED", flush=True)
        sys.exit(1)
        
    img_path = sys.argv[1]
    if not os.path.exists(img_path):
        print("ERROR_IMAGE_NOT_FOUND", flush=True)
        sys.exit(1)
        
    solve_captcha(img_path)
