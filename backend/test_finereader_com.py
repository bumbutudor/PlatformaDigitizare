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
        
        # Show version info
        print(f"    FineReader version: {fr_app.Version if hasattr(fr_app, 'Version') else 'Unknown'}")
        
        # Explore available methods and properties
        print("\n[2] Exploring available methods/properties...")
        try:
            # Use win32com to get type info
            for attr in dir(fr_app):
                if not attr.startswith('_'):
                    print(f"    - {attr}")
        except Exception as e:
            print(f"    Could not list attributes: {e}")
        
        # Try different approaches to process the file
        print("\n[3] Trying to process file...")
        
        # Approach 1: Try OpenDocument
        try:
            print("    Trying OpenDocument...")
            doc = fr_app.OpenDocument(input_file)
            print("    SUCCESS: OpenDocument worked!")
        except Exception as e:
            print(f"    OpenDocument failed: {e}")
            
            # Approach 2: Try ProcessFile
            try:
                print("    Trying ProcessFile...")
                result = fr_app.ProcessFile(input_file, output_file)
                print(f"    SUCCESS: ProcessFile worked! Result: {result}")
                return True, "ProcessFile succeeded"
            except Exception as e2:
                print(f"    ProcessFile failed: {e2}")
                
                # Approach 3: Try Recognize
                try:
                    print("    Trying Recognize...")
                    result = fr_app.Recognize(input_file)
                    print(f"    SUCCESS: Recognize worked! Result: {result}")
                except Exception as e3:
                    print(f"    Recognize failed: {e3}")
                    
                    # Approach 4: Try NewDocument
                    try:
                        print("    Trying NewDocument...")
                        doc = fr_app.NewDocument()
                        print("    SUCCESS: NewDocument worked!")
                    except Exception as e4:
                        print(f"    NewDocument failed: {e4}")
                        
                        # Approach 5: Try Documents collection
                        try:
                            print("    Trying Documents.Add...")
                            doc = fr_app.Documents.Add()
                            print("    SUCCESS: Documents.Add worked!")
                        except Exception as e5:
                            print(f"    Documents.Add failed: {e5}")
                            raise Exception("Could not create/open document with any method")
        
        return True, "Test completed"
        
    except Exception as e:
        print(f"\nERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        
        # Try alternative COM object names
        print("\n[*] Trying alternative COM object names...")
        alternatives = [
            "FineReader.Application.15",
            "FineReader.Application.1", 
            "ABBYY.FineReader.Application",
            "FREngine.Application",
            "FineReaderOCR.Application",
        ]
        
        for alt in alternatives:
            try:
                print(f"    Trying: {alt}...")
                test_app = win32com.client.Dispatch(alt)
                print(f"    SUCCESS: {alt} works!")
            except:
                print(f"    FAILED: {alt}")
        
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
