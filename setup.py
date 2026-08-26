from setuptools import setup, find_packages

setup(
    name="asmr-dsp",
    version="1.0.0",
    description="Local Windows Headphone EQ & Profile Manager for Logitech G PRO X SE with Equalizer APO and Dolby Atmos support",
    author="ASMR-DSP",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "PySide6>=6.5.0",
        "pycaw>=20240210",
        "comtypes>=1.4.0",
        "keyboard>=0.13.5",
    ],
    entry_points={
        "console_scripts": [
            "asmr-dsp=asmr_dsp.main:main",
        ],
    },
    python_requires=">=3.9",
)
