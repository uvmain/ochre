import sys
import easyocr

def main():
    if len(sys.argv) < 2:
        print("Usage: python main.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    
    try:
        reader = easyocr.Reader(['en'])
        results = reader.readtext(image_path)
        extracted_text = "\n".join([result[1] for result in results])
        print(extracted_text)
    except FileNotFoundError:
        print(f"Error: File not found at path: {image_path}")
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)
    except:
        sys.exit(1)

if __name__ == "__main__":
    main()
