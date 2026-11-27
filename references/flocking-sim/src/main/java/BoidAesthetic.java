import java.awt.*;

/**
 * Contains aesthetic configuration for boid including color and wing settings.
 * @author C24John.Pan
 */
public class BoidAesthetic {
    public String getName() {
        return name;
    }

    private final String name;
    private Color color = Color.pink;
    private int wingSize = -1;
    private int wingStartAngle = 130;
    private int wingArcAngle = 40;
    private double wingFlapPeriod = -1;

    /**
     * Create new BoidAesthetic with a name.
     * @param name the name.
     */

    public BoidAesthetic(String name) {
        this.name = name;
    }

    /**
     * Sets the color factory-style
     * @param color
     * @return
     */
    public BoidAesthetic setColor(Color color) {
        this.color = color;
        return this;
    }

    /**
     * Sets the wingSize factory-style
     * @param wingSize
     * @return
     */
    public BoidAesthetic setWingSize(int wingSize) {
        this.wingSize = wingSize;
        return this;
    }

    /**
     * Sets the wingStartAngle factory-style
     * @param wingStartAngle
     * @return
     */
    public BoidAesthetic setWingStartAngle(int wingStartAngle) {
        this.wingStartAngle = wingStartAngle;
        return this;
    }

    /**
     * Sets the wingArcAngle factory-style
     * @param wingArcAngle
     * @return
     */
    public BoidAesthetic setWingArcAngle(int wingArcAngle) {
        this.wingArcAngle = wingArcAngle;
        return this;
    }

    /**
     * Sets the wingFlapPeriod factory-style
     * @param wingFlapPeriod
     * @return
     */
    public BoidAesthetic setWingFlapPeriod(double wingFlapPeriod) {
        this.wingFlapPeriod = wingFlapPeriod;
        return this;
    }

    /**
     * Applies this aesthetic configuration to a boid.
     * @param boid
     */
    public void apply(Boid boid) {
        boid.setColor(color);
        boid.setWingSize(wingSize);
        boid.setWingStartAngle(wingStartAngle);
        boid.setWingArcAngle(wingArcAngle);
        boid.setWingFlapPeriod(wingFlapPeriod);
    }
}
