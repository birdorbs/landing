import java.awt.*;
import java.awt.image.BufferedImage;

/**
 * Boid class provides the single entity level for members of the flocks.
 * @author C24John.Pan
 */
public final class Boid {
    private GameSettings gameSettings;
    private Color color = Color.pink;

    /**
     * Enum of boid edge behaviors.
     */
    public enum EdgeBehavior {
        BOUNCE, PHASE
    }

    /**
     * Behavior of the boid when it hits an edge.
     */
    private EdgeBehavior edgeBehavior = EdgeBehavior.BOUNCE;
    private Vector330 position;
    private Vector330 bufferedVelocity;
    /**
     * The radius of the boid.
     */
    private int size = 10;
    /**
     * The wing radius of the boid.
     */
    private int wingSize = -1;
    /**
     * The angular size of the wing in degrees
     */
    private int wingArcAngle = 130;
    /**
     * The angle from the nose that the wing begins in degrees.
     */
    private int wingStartAngle = 40;
    /**
     * Time for one individual flap (i.e., just downard).
     */
    private double wingFlapPeriod = -1;
    private double flapProgress; //internal variable to track wing state

    /**
     * Change in position, in pixels per second
     */
    private Vector330 velocity;

    /**
     * Creates an instance of a boid.
     */
    public Boid () {

    }

    /**
     * Initializes the boid to begin simulating.
     * @param gameSettings information about the game context this boid is simulated in.
     */
    void Initialize(GameSettings gameSettings) {
        this.gameSettings = gameSettings;
        this.velocity = (new Vector330(
                gameSettings.rand.nextDouble(-1, 1),
                gameSettings.rand.nextDouble(-1, 1)
        )).scale(100);
        this.setPosition(new Vector330(
                gameSettings.rand.nextDouble(0, gameSettings.screenWidth),
                gameSettings.rand.nextDouble(0,gameSettings.screenHeight)
        ));
        flapProgress = gameSettings.rand.nextDouble()*10; //desync flaps


    }

    /**
     * Draws and animates the Boid.
     */
    void draw(double deltaTime) {
        var g = gameSettings.g;
        var center = Utils.WorldVectorToScreenPoint(
                gameSettings.screenHeight,
                position);

        //DRAW WINGS
        //Default wing size based on size
        int wingSize = this.wingSize < 0 ? size*3 : this.wingSize;
        //Default flap period based on speed and size (faster, smaller birbs flap more)
        double flapPeriod = this.wingFlapPeriod < 0 ?
                20/Math.max(20,this.getSpeed()) * (Math.max(20,size)/10) : this.wingFlapPeriod;
        this.flapProgress += deltaTime/flapPeriod;

        //Calculate alpha based on timing of wing
        double flapTiming = flapProgress % 2.0;
        //Invert timing for down flap
        if(flapTiming > 1) {
            flapTiming = 2 - flapTiming;
        }
        int wingAlpha = (int)Math.round(flapTiming * this.color.getAlpha()*.9);
        //Draw the wing graphics
        g.setColor(new Color(color.getRed(),color.getGreen(),color.getBlue(),wingAlpha));
        int direction = (int)Math.toDegrees(Math.atan2(velocity.getY(), velocity.getX()));
        g.fillArc(center.x-wingSize,center.y-wingSize,
                wingSize*2, wingSize*2,
                direction + wingStartAngle,
                wingArcAngle
        );
        g.fillArc(center.x-wingSize,center.y-wingSize,
                wingSize*2, wingSize*2,
                direction - wingStartAngle - wingArcAngle,
                wingArcAngle
        );

        //Draw nose
        //Wings communicate direction instead of nose
        if(false) {
            g.setColor(Color.black);
            Point lineEnd = Utils.WorldVectorToScreenPoint(
                    gameSettings.screenHeight,
                    position.add(velocity.normalize().scale(size * 2))
            );
            g.drawLine(
                    center.x,
                    center.y,
                    lineEnd.x,
                    lineEnd.y
            );
        }
        //Draw body
        g.setColor(this.color);
        g.fillOval(center.x - size,center.y - size,size*2,size*2);
    }


    /**
     * Gets the boid's current location.
     *
     * @return A Vector330 representing the boid's location.
     */
    Vector330 getPosition() {
        return this.position;
    }

    /**
     * Updates this Boid's position with the position vector.
     *
     * @param position
     */
    void setPosition(Vector330 position) {
        this.position = position;
    }

    /**
     * Gets the boid's current velocity magnitude.
     *
     * @return The boid's current velocity magnitude.
     */
    double getSpeed() {
        return velocity.magnitude();
    }

    /**
     * Sets the boid's speed to be updated on the next frame.
     *
     * @param speed
     */
    void bufferSpeed(double speed) {
        bufferVelocity(velocity.normalize().scale(speed));
    }

    /**
     * Gets the boid's current velocity.
     *
     * @return The boid's current velocity.
     */
    Vector330 getVelocity() {
        return this.velocity;
    }

    /**
     * Steps the boid one frame in the simulation.
     * @param deltaTime the time since last frame in seconds.
     */
    void simulate(double deltaTime) {
        if (bufferedVelocity != null) {
            velocity = bufferedVelocity;
            bufferedVelocity = null;
        }
        move(deltaTime);
    }

    /**
     * Moves the Boid per its current velocity vector, interacting with edges based on its edgeSetting.
     * @param deltaTime the time since last frame in seconds.
     */
    void move (double deltaTime) {
        setPosition(position.add(velocity.scale(deltaTime)));
        switch(edgeBehavior) {
            case BOUNCE:
                bounceMove(deltaTime);
                break;
            case PHASE:
                phaseMove(deltaTime);
                break;
        }

    }
    /**
     * Moves the Boid per its current velocity vector with bouncing behavior on the edges.
     * @param deltaTime the time since last frame in seconds.
     */
    void bounceMove(double deltaTime) {
        //Test collision with edge. If collide, set velocity in the direction away from edge
        double newX = velocity.getX();
        double newY = velocity.getY();
        if (position.getX() < size) {
            newX = (Math.abs(newX));
        }
        else if (position.getX() > (gameSettings.screenWidth - size)) {
            newX = (-Math.abs(newX));
        }

        if (position.getY() < size) {
            newY = (Math.abs(newY));
        }
        else if (position.getY() > (gameSettings.screenHeight - size)) {
            newY = (-Math.abs(newY));
        }
        velocity = new Vector330(newX,newY);
    }

    /**
     * Instead of bouncing off edge, hyperspace jump to other side of map.
     * @param deltaTime the time since last frame in seconds.
     */
    protected void phaseMove (double deltaTime) {
        var position = getPosition();
        var gameSettings = getGameSettings();

        //Wrap position
        position = new Vector330(
                Utils.Modulo(position.getX(), gameSettings.screenWidth),
                Utils.Modulo(position.getY(),gameSettings.screenHeight)
        );
        setPosition(position);
    }

    /**
     * Set's the boid's color
     *
     * @param color
     */
    void setColor(Color color) {
        this.color = color;
    }


    /**
     * Sets the boid's velocity to be updated before the next frame.
     *
     * @param velocity
     */
    void bufferVelocity(Vector330 velocity) {
        bufferedVelocity = velocity;
    }

    /**
     * Sets the edge behavior for the boid.
     * @param edgeBehavior The edge behavior.
     */
    public void setEdgeBehavior(EdgeBehavior edgeBehavior) {
        this.edgeBehavior = edgeBehavior;
    }


    /**
     * Sets the boid's size representing its radius.
     *
     * @param size
     */
    void setSize(int size) {
        this.size = size;
    }


    /**
     * Gets the boid's size representing its radius.
     */
    double getSize () {
        return this.size;
    }

    /**
     * Sets the wing size
     * @param wingSize the radius of the wing in pixels.
     */
    void setWingSize(int wingSize) {
        this.wingSize = wingSize;
    }

    /**
     * Sets the boid's wing arc angle in degrees.
     *
     * @param arcAngle
     */
    void setWingArcAngle(int arcAngle) {
        this.wingArcAngle = arcAngle;
    }

    /**
     * Sets the boid's wing start angle in degrees from the nose.
     *
     * @param startAngle
     */
    void setWingStartAngle(int startAngle) {
        this.wingStartAngle = startAngle;
    }

    /**
     * Sets the time it takes for the boid to flap its wings down and up.
     * @param period
     */
    void setWingFlapPeriod(double period) {
        this.wingFlapPeriod = period;
    }

    /**
     * Gets the game settings this boid operates with.
     * @return game settings
     */
    GameSettings getGameSettings() {
        return gameSettings;
    }
}
