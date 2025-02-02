#include <iostream>
#include <cstdlib>
#include <cmath>

/**
   A simple C++ class that encapsulates the x and y coordinates of a
   point in a two dimensional Euclidean plane.
*/
class Point {
    friend std::istream& operator>>(std::istream& is, Point& p);
    friend std::ostream& operator<<(std::ostream& os, const Point& p);
private:
    int x, y; // Coordinates for the points
    
public:
    /**
       Default constructor. This constructor creates a point at the
       origin by setting x and y coordinaes to zero.
     */
    inline Point() : x(0), y(0) {}
      
    /**
       Constructor to initialize x & y coordinates to a given default
       value.
       
       \param[in] xVal The default initial value for the x-coordinate.
       
       \param[in] yVal The default initial value for the -coordinate.
    */
    inline Point(int xVal, int yVal) : x(xVal), y(yVal) {}
    
    /**
       Convenience method to generate a point at a random location.
    */
    static Point make() {
        return Point(50 - (rand() % 100), 50 - (rand() % 100));
    }
    
    /**
       Computes the Euclidean distance of this point from the origin.

       \return The Euclidean distance of this point from the origin.
    */
    inline double distance() const { return std::sqrt((x * x) + (y * y)); }
    
    /**
       Returns the x-coordinate of this point.

       \return The x-coordinate of this point.
    */
    inline int getX() const { return x; }
    
    /**
       Returns the y-coordinate of this point.
       
       \return The y-coordinate of this point.
       
    */
    inline int getY() const { return y; }

    /**
       Returns a point that is the inverse of this point.
       
       This method returns a new point object that is the inverse of
       this point.  The inverse is created by negating the x and y
       coordinates.
       
       \return A point object that is the inverse of this point.
    */
    Point operator!() const { return Point(-x, -y); }

    /**
       Comparator method based on distance of points from the origin.

       \param[in] oth The other point to be compared against.
       
       \return This method returns true if the Euclidean distance of
       this point from the origin is less than the Euclidean distance
       of oth point.
    */
    inline bool operator<(const Point& oth) const {
        return distance() < oth.distance();
    }
    
    /**
       Comparator method based on distance of points from the origin.

       \param[in] oth The other point to be compared against.
       
       \return This method returns true if the Euclidean distance of
       this point from the origin is greather than the Euclidean
       distance of oth point.
    */
    bool operator>(const Point& oth) const;
    
    /**
       Compares two points for equality.
       
       \param[in] oth The other point to be compared.
       
       \return This method returns true if this Point and oth Point
       have exactly the same x and y coordinate.
    */
    inline bool operator==(const Point& oth) const {
        return ((x == oth.x) && (y == oth.y));
    }
    
    /**
       Adds two points together and retruns a new point.

       \param[in] oth The other point to be added.

       \return This method returns a new object that is constructed as:

       \code
           Point(x + oth.x, y + oth.y);
       \endcode
    */
    Point operator+(const Point& oth) {
        return Point(x + oth.x, y + oth.y);
    }

    /**
       Adds a constant value to both the x & y coordinates.

       \param[in] val The value to be added to the x & y coordinates
       to create a new point. 
       
       \return A new point that has its x & y coordinates offset from
       this Point by a given val.
    */
    Point operator+(const int val) {
        return Point(x + val, y + val);
    }
    
    /**
       Returns the quadrant for each point.

       This method returns one of the following quadrant numbers based
       on the x and y values:

       ---------------------------------------
       Condition          Return Value
       ---------------------------------------
       x >= 0 && y > 0        1
       x >= 0 && y < 0        2      
       x < 0 && y > 0         3
       x < 0 && y < 0         4
       
       \return The quadrant (1 through 4) for this point.
    */
    int getQuadrant() const;
    
    /** Convenience method to check if a point is in a given quadrant.
	
        \param[in] quadrant The quadrant number to check for.
    
        \return This method returns true if \c this point is in the
	given quadrant.
    */
    bool isQuadrant(const int quadrant) const {
      return (getQuadrant() == quadrant);
    }
};
