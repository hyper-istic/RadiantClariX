"""
Pre-flight check script
Run this BEFORE starting services to verify everything is ready
"""
import sys
import os
from pathlib import Path

def check_icon(passed):
    return "✅" if passed else "❌"

def check_python_version():
    """Check if Python version is compatible"""
    print("🔍 Checking Python version...")
    version = sys.version_info
    if version.major == 3 and version.minor >= 8:
        print(f"   {check_icon(True)} Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"   {check_icon(False)} Python {version.major}.{version.minor} (Need 3.8+)")
        return False

def check_venv():
    """Check if virtual environment exists"""
    print("🔍 Checking virtual environment...")
    venv_path = Path("venv")
    if venv_path.exists():
        print(f"   {check_icon(True)} Virtual environment found")
        return True
    else:
        print(f"   {check_icon(False)} Virtual environment not found")
        print("   Create it: python -m venv venv")
        return False

def check_model_files():
    """Check if model files exist"""
    print("🔍 Checking model files...")
    model_path = Path("xray_models/chest/hf_model")
    processor_path = Path("xray_models/chest/hf_processor")
    
    checks = []
    
    if model_path.exists():
        print(f"   {check_icon(True)} Model directory found")
        checks.append(True)
    else:
        print(f"   {check_icon(False)} Model directory not found: {model_path}")
        checks.append(False)
    
    if processor_path.exists():
        print(f"   {check_icon(True)} Processor directory found")
        checks.append(True)
    else:
        print(f"   {check_icon(False)} Processor directory not found: {processor_path}")
        checks.append(False)
    
    return all(checks)

def check_required_packages():
    """Check if required Python packages are installed"""
    print("🔍 Checking required packages...")
    packages = {
        'fastapi': 'FastAPI',
        'uvicorn': 'Uvicorn',
        'transformers': 'Transformers',
        'torch': 'PyTorch',
        'PIL': 'Pillow'
    }
    
    all_installed = True
    for pkg, name in packages.items():
        try:
            __import__(pkg)
            print(f"   {check_icon(True)} {name}")
        except ImportError:
            print(f"   {check_icon(False)} {name} (Not installed)")
            all_installed = False
    
    if not all_installed:
        print("\n   Install missing packages:")
        print("   pip install fastapi uvicorn transformers torch pillow python-multipart")
    
    return all_installed

def check_nodejs():
    """Check if Node.js is installed"""
    print("🔍 Checking Node.js installation...")
    import subprocess
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, 
                              text=True, 
                              timeout=5)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"   {check_icon(True)} Node.js {version}")
            return True
        else:
            print(f"   {check_icon(False)} Node.js not working")
            return False
    except FileNotFoundError:
        print(f"   {check_icon(False)} Node.js not installed")
        return False
    except Exception as e:
        print(f"   {check_icon(False)} Error checking Node.js: {e}")
        return False

def check_node_modules():
    """Check if Node.js dependencies are installed"""
    print("🔍 Checking Node.js dependencies...")
    node_modules = Path("node_modules")
    if node_modules.exists():
        print(f"   {check_icon(True)} node_modules found")
        return True
    else:
        print(f"   {check_icon(False)} node_modules not found")
        print("   Run: npm install")
        return False

def check_env_file():
    """Check if .env file exists"""
    print("🔍 Checking .env file...")
    env_file = Path(".env")
    if env_file.exists():
        print(f"   {check_icon(True)} .env file found")
        return True
    else:
        print(f"   {check_icon(False)} .env file not found (optional)")
        return True  # Not critical

def check_ports_available():
    """Check if required ports are available"""
    print("🔍 Checking port availability...")
    import socket
    
    ports = {5000: "Node.js Backend", 8502: "Python AI Model"}
    all_available = True
    
    for port, service in ports.items():
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind(('0.0.0.0', port))
            sock.close()
            print(f"   {check_icon(True)} Port {port} available ({service})")
        except OSError:
            print(f"   {check_icon(False)} Port {port} in use ({service})")
            all_available = False
    
    return all_available

def main():
    print("=" * 60)
    print("  RadiantClariX Pre-Flight Check")
    print("=" * 60)
    print()
    
    # Change to backend directory if not already there
    if Path("backend").exists():
        os.chdir("backend")
        print("📂 Changed to backend directory")
        print()
    
    checks = {
        "Python Version": check_python_version(),
        "Virtual Environment": check_venv(),
        "Model Files": check_model_files(),
        "Python Packages": check_required_packages(),
        "Node.js": check_nodejs(),
        "Node Modules": check_node_modules(),
        "Environment File": check_env_file(),
        "Port Availability": check_ports_available(),
    }
    
    print()
    print("=" * 60)
    print("  Summary")
    print("=" * 60)
    
    for check_name, passed in checks.items():
        status = "PASS" if passed else "FAIL"
        icon = check_icon(passed)
        print(f"{icon} {check_name}: {status}")
    
    print()
    
    passed_count = sum(checks.values())
    total_count = len(checks)
    
    if passed_count == total_count:
        print("✅ All checks passed! You're ready to start services.")
        print()
        print("Next steps:")
        print("  1. Start services: .\\start-all-services.ps1")
        print("  2. Get your IP: .\\get-ip.ps1")
        print("  3. Update services/api.js with your IP")
        print("  4. Start React Native app: npm start")
        return 0
    else:
        print(f"⚠️  {total_count - passed_count} check(s) failed.")
        print()
        print("Please fix the issues above before starting services.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    print()
    input("Press Enter to close...")
    sys.exit(exit_code)
