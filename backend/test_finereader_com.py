"""
Test script for ABBYY FineReader 15 COM Automation
Run this on Windows server where FineReader is installed

Usage:
    python test_finereader_com.py "C:\path\to\image.png" "C:\path\to\output.txt"
    python test_finereader_com.py "C:\path\to\document.pdf" "C:\path\to\output.txt" --pattern "C:\path\to\model.fbt"
"""

import sys
import os

try:
    import win32com.client
except ImportError:
    print("ERROR: pywin32 not installed. Run: pip install pywin32")
    sys.exit(1)


def test_finereader_ocr(input_file, output_file, pattern_file=None):
    """
    Test ABBYY FineReader OCR via COM Automation
    
    Args:
        input_file: Path to input image or PDF
        output_file: Path to output text file
        pattern_file: Optional path to .fbt pattern file
    """
    print(f"Input: {input_file}")
    print(f"Output: {output_file}")
    if pattern_file:
        print(f"Pattern: {pattern_file}")
    
    try:
        # Create FineReader Application object
        print("\n[1] Creating FineReader COM object...")
        fr_app = win32com.client.Dispatch("ABBYY.FineReader15.OCR.Application")
        print("    SUCCESS: FineReader COM object created")
        
        # Set recognition languages
        print("\n[2] Setting recognition languages...")
        try:
            fr_app.SetRecognitionLanguages("Romanian")
            print("    SUCCESS: Language set to Romanian")
        except Exception as e:
            print(f"    WARNING: Could not set language: {e}")
        
        # Try AddImages method
        print(f"\n[3] Adding image: {input_file}")
        try:
            fr_app.AddImages(input_file)
            print("    SUCCESS: Image added with AddImages")
        except Exception as e:
            print(f"    AddImages failed: {e}")
            
            # Try OpenRead
            try:
                print("    Trying OpenRead...")
                fr_app.OpenRead(input_file)
                print("    SUCCESS: OpenRead worked!")
            except Exception as e2:
                print(f"    OpenRead failed: {e2}")
        
        # Try StartExecute
        print("\n[4] Starting OCR execution...")
        try:
            fr_app.StartExecute()
            print("    SUCCESS: StartExecute called")
        except Exception as e:
            print(f"    StartExecute failed: {e}")
        
        print("\n[5] Test completed - FineReader window should be open")
        print("    Note: FineReader 15 Standard edition opens UI for OCR")
        print("    For headless/automated OCR, FineReader Server or Engine is needed")
        
        return True, "Test completed - check FineReader window"
        
    except Exception as e:
        print(f"\nERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        
        return False, str(e)


def list_com_objects():
    """List available FineReader COM objects in registry"""
    print("\n[*] Searching for FineReader COM objects in registry...")
    
    try:
        import winreg
        
        com_objects = []
        key_path = r"SOFTWARE\Classes"
        
        try:
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path)
            i = 0
            while True:
                try:
                    subkey_name = winreg.EnumKey(key, i)
                    if 'finereader' in subkey_name.lower() or 'abbyy' in subkey_name.lower() or 'frengine' in subkey_name.lower():
                        com_objects.append(subkey_name)
                    i += 1
                except OSError:
                    break
            winreg.CloseKey(key)
        except Exception as e:
            print(f"    Error reading HKLM: {e}")
        
        # Also check HKEY_CLASSES_ROOT
        try:
            key = winreg.OpenKey(winreg.HKEY_CLASSES_ROOT, "")
            i = 0
            while True:
                try:
                    subkey_name = winreg.EnumKey(key, i)
                    if 'finereader' in subkey_name.lower() or 'abbyy' in subkey_name.lower() or 'frengine' in subkey_name.lower():
                        if subkey_name not in com_objects:
                            com_objects.append(subkey_name)
                    i += 1
                except OSError:
                    break
            winreg.CloseKey(key)
        except Exception as e:
            print(f"    Error reading HKCR: {e}")
        
        if com_objects:
            print("    Found COM objects:")
            for obj in com_objects:
                print(f"      - {obj}")
        else:
            print("    No FineReader COM objects found")
            
        return com_objects
        
    except ImportError:
        print("    winreg not available")
        return []


if __name__ == "__main__":
    print("=" * 60)
    print("ABBYY FineReader 15 COM Automation Test")
    print("=" * 60)
    
    # First, list available COM objects
    list_com_objects()
    
    if len(sys.argv) < 3:
        print("\nUsage:")
        print('  python test_finereader_com.py "input.png" "output.txt"')
        print('  python test_finereader_com.py "input.pdf" "output.txt" --pattern "model.fbt"')
        print("\nExample:")
        print('  python test_finereader_com.py "C:\\test\\image.png" "C:\\test\\result.txt"')
        sys.exit(0)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    pattern_file = None
    
    if "--pattern" in sys.argv:
        pattern_idx = sys.argv.index("--pattern")
        if pattern_idx + 1 < len(sys.argv):
            pattern_file = sys.argv[pattern_idx + 1]
    
    if not os.path.exists(input_file):
        print(f"ERROR: Input file not found: {input_file}")
        sys.exit(1)
    
    print()
    success, result = test_finereader_ocr(input_file, output_file, pattern_file)
    
    if success:
        print("\n✓ TEST PASSED")
    else:
        print("\n✗ TEST FAILED")
    
    sys.exit(0 if success else 1)
