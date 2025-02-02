#include "Point.h"

// Stream insertion operator for point.
std::ostream& operator<<(std::ostream& os, const Point& pt) {
    return (os << pt.x << " " << pt.y);
}

// Stream extraction operator for point.
std::istream& operator>>(std::istream& is, Point& pt) {
    return (is >> pt.x >> pt.y);
}

bool
Point::operator>(const Point& oth) const {
    return distance() > oth.distance();
}

int
Point::getQuadrant() const {
    return ((x >= 0) ? (y > 0 ? 1 : 4) : (y > 0 ? 2 : 3));
}
