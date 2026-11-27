import java.awt.*;
import java.util.Random;

/**
 * Encapsulates relevant data for a simulation.
 * @author C24John.Pan
 */
public class GameSettings {
    public final Graphics2D g;
    public final DrawingPanel panel;
    public final Random rand;
    public final int screenWidth;
    public final int screenHeight;
    public final Simulation simulation;

    /**
     * Creates a new instance with full parameters.
     * @param g the graphics object for drawing.
     * @param panel The DrawingPanel
     * @param rand A random number generator.
     * @param screenWidth
     * @param screenHeight
     */
    public GameSettings(Graphics2D g, DrawingPanel panel, Random rand, int screenWidth, int screenHeight, Simulation simulation) {
        this.g = g;
        this.panel = panel;
        this.rand = rand;
        this.screenHeight = screenHeight;
        this.screenWidth = screenWidth;
        this.simulation = simulation;
    }
}
