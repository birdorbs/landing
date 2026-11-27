import java.util.Scanner;


/**
 * Represents a Vector on the x and y axes.
 * @author C24John.Pan
 */
public final class Vector330 {
    private final double x;
    private final double y;

    /**
     * Create a Vector330 with specified x and y dimension values.
     *
     * @param x the value in the x dimension
     * @param y the value in the y dimension
     */
    public Vector330(double x, double y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Create a Vector330 at the origin.
     */
    public Vector330() {
        this(0, 0);
    }

    /**
     * takes in a Scanner object and returns a Vector330 object
     * built from the input from the Scanner. The input must be of the form, "{@literal <}
     * 5.1, 3.2 {@literal >}" where there are spaces after "{@literal <}" and "," as well as before "{@literal >}".
     *
     * @param scanner Scanner with input to be parsed.
     * @return A parsed Vector330 instance.
     */
    public static Vector330 parseVector(Scanner scanner) throws Exception {
        //Set delimiter
        var originalDelimiter = scanner.delimiter();
        scanner.useDelimiter("[" + originalDelimiter + ",]");

        //Read starting <
        if (!scanner.hasNext("<")) {
            throw new Exception("PARSE ERROR: Missing '<' to start vector");
        }
        scanner.next();

        //Read x
        if (!scanner.hasNextDouble()) {
            throw new Exception("PARSE ERROR: Missing X coordinate for vector");
        }
        double x = scanner.nextDouble();

        scanner.next(); //consume comma and whitespace

        //Read y
        if (!scanner.hasNextDouble()) {
            throw new Exception("PARSE ERROR: Missing Y coordinate for vector");
        }
        double y = scanner.nextDouble();

        //Read closing >
        scanner.useDelimiter(" ");
        if (!scanner.hasNext(">")) {
            throw new Exception("PARSE ERROR: Missing '>' to end vector");
        }
        scanner.skip(" >");
        scanner.useDelimiter(originalDelimiter);

        return new Vector330(x, y);
    }

    /**
     * Get the value in the x dimension.
     * @return The x value.
     */
    public double getX() {
        return x;
    }

    /**
     * Get the value in the y dimension.
     * @return The y value.
     */
    public double getY() {
        return y;
    }

    /**
     * Checks for equality of two vectors subject to a tolerance of 1.0e-09 (both the x and the y components must be within this tolerance).
     *
     * @param o The object to check this vector against.
     * @return True if difference of vector values are within tolerance, False if vector values are different.
     */
    @Override
    public boolean equals(Object o) {
        //https://www.geeksforgeeks.org/overriding-equals-method-in-java/
        if (o == this) {
            return true;
        }
        if (!(o instanceof Vector330)) {
            return false;
        }
        return this.equals((Vector330) o);
    }

    /**
     * Checks for equality of two vectors subject to a tolerance of 1.0e-09 (both the x and the y components must be within this tolerance).
     *
     * @param other The vector to check this vector against.
     * @return True if difference of vector values are within tolerance, False if vector values are different.
     */
    public boolean equals(Vector330 other) {
        double tolerance = 1.0e-9;
        double xDiff = Math.abs(getX() - other.getX());
        if (xDiff > tolerance) {
            return false;
        }
        double yDiff = Math.abs(getY() - other.getY());
        if (yDiff > tolerance) {
            return false;
        }
        return true;
    }

    /**
     * Adds current vector to another vector passed as a parameter
     * producing a new third result vector.
     *
     * @param other Other vector to add.
     * @return A new vector with components equal to the sum of components of this and the other vector.
     */
    public Vector330 add(Vector330 other) {
        return new Vector330(
                getX() + other.getX(),
                getY() + other.getY());
    }

    /**
     * Starting with the current vector subtract another vector passed
     * as a parameter producing a new third result vector.
     *
     * @param other Other vector to subtract.
     * @return A new vector with components equal to the subtraction of the other vector from this vector.
     */
    public Vector330 subtract(Vector330 other) {
        return new Vector330(
                getX() - other.getX(),
                getY() - other.getY());
    }

    /**
     * Computes the dot product of the current vector and another
     * vector passed as a parameter to produce and return a scalar double value.
     * For example, a.dotProduct( b ) produces ( (a.x * b.x) + (a.y * b.y) ).
     *
     * @param other the other vector.
     * @return The dot product of the two vectors.
     */
    public double dotProduct(Vector330 other) {
        return getX() * other.getX() + getY() * other.getY();
    }

    /**
     * Produces a new vector that is the original vector with each
     * component (x and y) multiplied by the provided scaling factor. For
     * example, a.scale(3.0) produces {@literal <} a.x * 3.0, a.y * 3.0 {@literal >}.
     *
     * @param factor The scaling factor.
     * @return A new vector that is this vector scaled by the factor.
     */
    public Vector330 scale(double factor) {
        return new Vector330(
                getX() * factor,
                getY() * factor
        );
    }

    /**
     * Produces a scalar value that is the length of the current
     * vectors. For example, a.magnitude() returns Sqrt((a.x * a.x) + (a.y * a.y)).
     *
     * @return the magnitude.
     */
    public double magnitude() {
        return Math.sqrt(getX() * getX() + getY() * getY());
    }

    /**
     * Produces a scalar double value that is the direction (angle in
     * radians) of the current vector. The Math.atan2() method will be helpful
     * here.
     *
     * @return the angle indicating direction.
     */
    public double direction() {
        return Math.atan2(getY(), getX());
    }

    /**
     * Produces a new returned vector with the same direction as
     * the current vector but with a length (magnitude) of 1.0. Hint: multiply the
     * vector by a scalar that is one over its magnitude. If the magnitude is less
     * than or equal to 1.0E-09, just return a zero vector.
     *
     * @return Normalized vector.
     */
    public Vector330 normalize() {
        double mag = magnitude();
        if (mag <= 1e-09) {
            //return zero vector in special case to prevent division by zero
            return new Vector330(0, 0);
        }
        return new Vector330(getX() / mag, getY() / mag);
    }

    /**
     * Returns the string representation of this Vector330.
     * @return String representation of this Vector330.
     */
    public String toString() {
        return String.format("< %.1f, %.1f >", getX(), getY());
    }
}