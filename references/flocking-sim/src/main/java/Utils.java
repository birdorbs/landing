import java.awt.*;

/**
 * Utility functions.
 * @author C24John.Pan
 */
public final class Utils {
    /**
     * Converts a vector in game space to a point in screen space
     * @param worldVector
     * @return
     */
    public static Point WorldVectorToScreenPoint(int screenHeight, Vector330 worldVector) {
        //Invert y position for screen space
        worldVector = new Vector330(worldVector.getX(), screenHeight - worldVector.getY());
        return new Point((int)Math.round(worldVector.getX()), (int)Math.round(worldVector.getY()));
    }

    /**
     * Converts screen point to world vector.
     * @param screenHeight
     * @param screenPoint
     * @return
     */
    public static Vector330 ScreenPointToWorldVector(int screenHeight, Point screenPoint) {
        return new Vector330(screenPoint.getX(), screenHeight - screenPoint.getY());
    }

    /**
     * Returns the distance between two boids.
     * @param boid0
     * @param boid1
     * @return The distance between two boids.
     */
    public static double Distance (Boid boid0, Boid boid1) {
        return boid0.getPosition().subtract(boid1.getPosition()).magnitude();
    }

    /**
     * Returns the distance between two world positions.
     * @param position0
     * @param position1
     * @return the distance between two world positions.
     */
    public static double Distance (Vector330 position0, Vector330 position1) {
        return position0.subtract(position1).magnitude();
    }
    /**
     * Returns the modulo instead of the remainder.
     * @param a dividend
     * @param b divisor
     * @return a mod b
     */
    public static double Modulo (double a, double b) {
        return (((a % b) + b) % b);
    }
}
