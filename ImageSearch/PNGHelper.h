#ifndef PNG_IMAGE_HELPER_H
#define PNG_IMAGE_HELPER_H

#include "PNG.h"
#include <iostream>

// Use PixBuf as a shortcut datatype to refer to
// std::std::vector<unsigned char>
typedef std::vector<unsigned char> PixBuf;

/**
   A simple class to wrap a PixBuf::iterator and access 3 consecutive
   values as Red, Green, & Blue components of a RGB pixel.
*/
class Pixel {
    friend std::ostream& operator<<(std::ostream& os, const Pixel& pix) {
        return os << "(" << (int) *(pix.start + 0)
		  << "," << (int) *(pix.start + 1)
		  << "," << (int) *(pix.start + 2)
		  << ")";
    }    
public:
    inline Pixel(PixBuf::iterator start) : start(start) {}
    inline ~Pixel() {}

    static int max(const int dRed, const int dGreen, const int dBlue) {
        return std::max(dRed, std::max(dGreen, dBlue));
    }
    
    inline int operator-(const Pixel& other) const {
	return max(std::abs(*(start + 0) - *(other.start + 0)),
		   std::abs(*(start + 1) - *(other.start + 1)),
		   std::abs(*(start + 2) - *(other.start + 2)));
    }
    
    inline Pixel& operator=(const Pixel& src) {
        *(start + 0) = *(src.start + 0);
        *(start + 1) = *(src.start + 1);
        *(start + 2) = *(src.start + 2);
        *(start + 3) = *(src.start + 3);
        return *this;
    }
    
    inline void addTo(int& red, int& green, int& blue) {
        red   += *(start + 0);
        green += *(start + 1);
        blue  += *(start + 2);
    }
    
    inline bool operator==(const Pixel& other) const {
        return (*(start + 0) == *(other.start + 0) &&
                *(start + 1) == *(other.start + 1) &&
                *(start + 2) == *(other.start + 2));
    }
    
private:
    // The pixel buffer that holds information about the RGB data for
    // this pixel. This vector is essentially reference to a
    // sub-vector within the image associated with this pixel.
    PixBuf::iterator start;
};

/**
   A simple wrapper class around PNG that provides convenient access
   (via a functor) to a sub-image starting at a given row and column
   position.
*/
class PNGHelper {
public:
    PNGHelper(PNG& png, int startRow = 0, int startCol = 0) :
        startRow(startRow), startCol(startCol), png(png) {}
    
    virtual ~PNGHelper() {}
    
    inline Pixel operator()(int row, int col) const {
        const int offset = ((startRow + row) * png.getWidth() +
                            (startCol + col)) * 4;
        return Pixel((png.getBuffer().begin() + offset));
    }
    
protected:
    int startRow;
    int startCol;
    
private:
    PNG& png;
};

#endif
