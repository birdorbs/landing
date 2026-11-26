import java.awt.*;
import java.awt.event.KeyEvent;
import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.ArrayBlockingQueue;

/**
 * Top level class for the boid Simulation with the start() method to begin the simulation.
 * Processes the following inputs:
 * LMB - evade
 * RMB - end simulation
 * Spacebar - pause
 * @author C24John.Pan
 */
public class Simulation {

    //TODO: Encapsulate these constant settings
    private static final int SCREEN_WIDTH = 1200;
    private static final int SCREEN_HEIGHT = 600;
    private static final double CLICK_ANIMATION_DURATION = .85;
    private static final int CLICK_ANIMATION_SIZE = 300;
    private static final Color BACKGROUND_COLOR = new Color(50,40,60);
    private GameSettings gameSettings;

    private boolean paused;
    private ArrayList<Boid> boids = new ArrayList<Boid>();
    private ArrayList<Flock> flocks = new ArrayList<Flock>();

    private long lastFrameTime;
    private double clickAnimationTimer;
    private Point clickAnimationPoint;
    private boolean ended = true;

    private long frameCount = 0;
    private Simulation queuedSimulation = null;
    private ArrayBlockingQueue<Boid> queuedInitBoids = new ArrayBlockingQueue<Boid>(1000);
    private ArrayBlockingQueue<Flock> queuedInitFLock = new ArrayBlockingQueue<Flock>(1000);
    private ArrayBlockingQueue<Boid> queuedRemoveBoids = new ArrayBlockingQueue<Boid>(1000);
    private ArrayBlockingQueue<Flock> queuedRemoveFLock = new ArrayBlockingQueue<Flock>(1000);

    /**
     * Create a new simulation instance.
     */
    public Simulation(String name) {
        var panel = new DrawingPanel(SCREEN_WIDTH, SCREEN_HEIGHT);
        panel.setWindowTitle(name);
        var g = panel.getGraphics();
        g.setRenderingHint(
                RenderingHints.KEY_STROKE_CONTROL,
                RenderingHints.VALUE_STROKE_NORMALIZE);
        g.setRenderingHint(
                RenderingHints.KEY_INTERPOLATION,
                RenderingHints.VALUE_INTERPOLATION_BILINEAR
        );

        this.gameSettings = new GameSettings(
                panel.getGraphics(),
                panel,
                new Random(),
                SCREEN_WIDTH,
                SCREEN_HEIGHT,
                this
        );
    }

    /**
     * Gets the number of update frames since the start of the simulation.
     * @return frame count
     */
    public long getFrameCount() {
        return frameCount;
    }

    /**
     * Begins the simulation.
     */
    public void start() {
        //Prevent starting ongoing simulation
        if (!ended) {
            System.err.println("You can't start an ongoing simulation!");
            return;
        }
        ended = false;

        lastFrameTime = System.nanoTime(); //Initialize time tracking

        frameCount++;

        while (!ended) {
            Update();
        }

        gameSettings.panel.closeWindow();

        if (queuedSimulation != null) {
            queuedSimulation.start();
            queuedSimulation = null;
        }
    }

    /**
     * Queue starting another simulation on the same thread while ending this one.
     * @param simulation the next simulation to run.
     */
    public void endAndQueue(Simulation simulation) {
        this.end();
        queuedSimulation = simulation;
    }
    /**
     * Initializes a flock into the simulation on the next frame.
     * @param flock
     */
    void bufferInitializeFlock(Flock flock) {
        queuedInitFLock.add(flock);
    }


    /**
     * Initializes a boid into the simulation on the next frame.
     * @param boid
     */
    public void bufferInitializeBoid(Boid boid) {
        queuedInitBoids.add(boid);
    }

    /**
     * Immediate initialize a boid.
     * @param boid
     */
    public void initializeBoid(Boid boid) {
        boid.Initialize(gameSettings);
        boids.add(boid);
    }

    /**
     * Creates and initializes boid into simulation.
     * @return boid
     */
    public Boid createBoid () {
        var boid = new Boid();
        initializeBoid(boid);
        return boid;
    }


    /**
     * Thread-safe removal of boids on next frame.
     * @param boid
     */
    public void removeBoid (Boid boid) {
        queuedRemoveBoids.add(boid);
    }

    /**
     * Thread-safe removal of flock and all its boids on next frame.
     * @param flock
     */
    public  void queueRemoveFlock(Flock flock) {
        queuedRemoveFLock.add(flock);
    }

    /**
     * Receive update signal representing one frame advancement.
     */
    private void Update() {
        //Calculate delta time
        long curTime = System.nanoTime();
        double deltaTime = (curTime - lastFrameTime) / 1000000000d;
        //Cap delta time at 3 FPS to prevent large hopping from unexpected lag
        deltaTime = Math.min(deltaTime, 1 / 3d);
        lastFrameTime = curTime;

        ProcessInput ();

        processQueues();
        if (!paused) {
            simulate(deltaTime);
            draw(deltaTime);
        }
    }

    /**
     * Process thread-safe queued procedures.
     */
    private void processQueues() {
        //init flocks
        while(!queuedInitFLock.isEmpty()) {
            var flock = queuedInitFLock.remove();
            flock.initialize(gameSettings);
            flocks.add(flock);
        }
        //init boids
        while(!queuedInitBoids.isEmpty()) {
            var boid = queuedInitBoids.remove();
            initializeBoid(boid);
        }

        //remove flocks
        while(!queuedRemoveFLock.isEmpty()) {
            var flock = queuedRemoveFLock.remove();
            flocks.remove(flock);
            for(var boid : flock.boids) {
                removeBoid(boid);
            }
        }
        //remove boids
        while(!queuedRemoveBoids.isEmpty()) {
            var boid = queuedRemoveBoids.remove();
            int index = boids.indexOf(boid);
            if (index > 0) {
                boids.remove(index);
            }
        }
    }

    private void ProcessInput() {
        var panel = gameSettings.panel;

        //Animation and evasion for left mouse click
        if (panel.isMouseButtonDown(DrawingPanel.LEFT_BUTTON)) {
            if (clickAnimationTimer <= 0 || panel.mouseClickHasOccurred(DrawingPanel.LEFT_BUTTON)) {
                clickAnimationPoint = new Point(panel.getMouseX(), panel.getMouseY());
                clickAnimationTimer = CLICK_ANIMATION_DURATION;
                var evasionSpot = Utils.ScreenPointToWorldVector(
                        gameSettings.screenHeight,
                        clickAnimationPoint
                );
                for (var flock : flocks) {
                    flock.evade(evasionSpot);
                }
            }
        }
        //End simulation for right mouse click
        if (panel.mouseClickHasOccurred(DrawingPanel.RIGHT_BUTTON)) {
            end();
        }
        //Pause for spacebar
        if (panel.keyHasBeenHit(KeyEvent.VK_SPACE)) {
            //Basically just does:
            //paused = !pause;
            if (!paused) {
                Pause(); //paused = true
            }
            else {
                Unpause();
            }
        }
    }

    /**
     * Distribute simulate signal to flocks and boids
     * @param deltaTime time since last frame
     */
    private void simulate(double deltaTime) {
        var flocks = this.flocks.stream().toList(); //prevent thread list modification issues
        for (var flock : flocks) {
            flock.simulate(deltaTime);
        }
        var boids = this.boids.stream().toList();
        for (Boid boid : boids) {
            boid.simulate(deltaTime);
        }
    }

    /**
     * Draw and animate the simulation.
     * @param deltaTime time since last frame.
     */
    private void draw(double deltaTime) {
        var panel = gameSettings.panel;
        panel.setBackground(BACKGROUND_COLOR);

        //Draw a fading circle when click
        if (clickAnimationTimer > 0) {
            double progress = clickAnimationTimer/CLICK_ANIMATION_DURATION;
            gameSettings.g.setColor(new Color(100,100,100,
                    (int)Math.round(150 * progress))
            );
            int size = (int)(CLICK_ANIMATION_SIZE * (1-progress));
            gameSettings.g.fillOval(
                    clickAnimationPoint.x - size/2,
                    clickAnimationPoint.y - size/2,
                    size,
                    size
            );
            clickAnimationTimer -= deltaTime;
        }
        for (Boid boid : boids) {
            boid.draw(deltaTime);
        }
        //Ambience
        var ambience = new Color(
                BACKGROUND_COLOR.getRed(),
                BACKGROUND_COLOR.getGreen(),
                BACKGROUND_COLOR.getBlue(),
                100
        );
        panel.setBackground(ambience);

        panel.copyGraphicsToScreen();
    }


    /**
     * Pauses the simulation.
     */
    public void Pause() {
        paused = true;
    }

    /**
     * Unpauses the simulation.
     */
    public void Unpause() {
        paused = false;
    }

    /**
     * If paused, unpauses. If unpaused, pauses.
     */
    public void togglePause () {
        if (!paused) {
            Pause(); //paused = true
        }
        else {
            Unpause();
        }
    }

    /**
     * End the simulation on the next frame.
     */
    public void end() {
        ended = true;
    }


    /**
     * Finds the first flock with a certain name.
     * @param name of flock
     * @return a flock if found or null if not found.
     */
    public Flock getFlock(String name) {
        var find = flocks.stream().filter(flock -> flock.getName() == name);
        return null;
    }

    /**
     * Gets the ith flock.
     * @param i index of flock.
     * @return The flock. Returns null if flock is not available for index.
     */
    public Flock getFlock(int i) {
        if (i < 0 || i >= flocks.size()) {
            return null;
        }
        return flocks.get(i);
    }

    /**
     * Gets the number of initialized flocks.
     * @return count of flocks.
     */
    public int GetFlockCount () {
        return flocks.size();
    }

    /**
     * Returns the game settings applied to the simulation.
     * @return the game settings applied to the simulation.
     */
    public GameSettings getGameSettings(){
        return gameSettings;
    }
}
