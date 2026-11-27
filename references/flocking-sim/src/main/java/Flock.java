import java.util.ArrayList;

/**
 * A flock of boids; drives steering behaviors.
 * @author C24John.Pan
 */
public class Flock {

    private String name;
    private double speed;

    private double phaseRatio = 0;
    protected double alignmentRadius = 200;
    protected double cohesionRadius = 200;
    protected double evasionRadius = 200;
    protected double evasionDuration = 2;
    protected double separationRadius = -1;

    //Note: For reference, the current velocity weight is 100 by default.
    protected double alignmentWeight = 120;
    protected double cohesionWeight = 40;
    protected double currentVelocityWeight = 100;
    protected double separationWeight = 80;



    protected double evasionWeight = 800;

    private int averageSize = 10;

    /**
     * The target number of boids in this flock.
     */
    private  int targetCount;

    private double evasionTimer;
    private Vector330 evasionPoint;
    protected ArrayList<Boid> boids = new ArrayList<>();


    private BoidAesthetic aesthetic = new BoidAesthetic("default");
    private  GameSettings gameSettings;

    /**
     * Creates a new instance of a Flock.
     * @param name name of the flock.
     * @param speed target speed of boids in the flock.
     */
    public Flock(String name, double speed) {
        this.name = name;
        this.speed = speed;
    }

    /**
     * Creates a new instance of a Flock.
     */
    public  Flock() {

    }

    /**
     * Initializes flock into a simulation
     * @param gameSettings game settings of simulation.
     */
    public void initialize(GameSettings gameSettings) {
        this.gameSettings = gameSettings;
        applyPhaseRatioAll();
        for (var boid : boids) {
            applySize(boid);
        }
        for (var boid : boids) {
            applyAesthetic(boid);
        }
        applyTargetCount();
    }


    /**
     * Calculate new velocities for boids in this flock.
     * @param deltaTime time between frames.
     */
    public void simulate(double deltaTime) {
        applyTargetCount();

        double steeringWeight;

        //Calculate and apply steering behaviors
        for (Boid boid0 : boids) {
            Vector330 steering = null;
            double evasionDist;
            //Prioritize evasion above other behaviors
            if (evasionTimer > 0 &&
                    (evasionDist = Utils.Distance(boid0.getPosition(), evasionPoint)) < evasionRadius) {

                if (evasionDist < evasionRadius) {
                    var evasionDir = boid0.getPosition().subtract(evasionPoint).normalize();
                    if (evasionDist == 0) {
                        evasionDir = new Vector330(1, 0);
                    }
                    steering = evasionDir.scale(speed);
                }
                steeringWeight = evasionWeight;
            } else {
                steeringWeight = alignmentWeight + cohesionWeight + separationWeight;

                //Alignment velocity
                Vector330 alignmentDir = new Vector330();
                for (Boid boid1 : boids) {
                    var dist = Utils.Distance(boid0, boid1);
                    if (dist < alignmentRadius) {
                        alignmentDir = alignmentDir.add(boid1.getVelocity());
                    }
                }
                alignmentDir = alignmentDir.normalize();

                //Calculate cohesion
                Vector330 cohesionMoment = new Vector330();
                int cohesionCount = 0;
                for (Boid boid1 : boids) {
                    var dist = Utils.Distance(boid0, boid1);
                    if (dist < cohesionRadius) {
                        cohesionMoment = cohesionMoment.add(boid1.getPosition());
                        cohesionCount++;
                    }
                }
                cohesionMoment = cohesionMoment.scale(1d / cohesionCount);
                var cohesionDir = cohesionMoment.subtract(boid0.getPosition()).normalize();

                //If separation distance is negative, use the boid's size
                separationRadius = separationRadius < 0 ? boid0.getSize() * 2 : separationRadius;
                //Calc separation
                //calculated differently as separation steering increases when things are closer
                Vector330 separation = new Vector330();
                for (Boid boid1 : boids) {
                    var dist = Utils.Distance(boid0, boid1);
                    if (dist < separationRadius) {
                        //Closeness increases more intensely when boids are closer
                        var closeness = 1 - (dist * dist) / (separationRadius * separationRadius);
                        //Scale separation intensity based on closeness
                        separation = separation.add(
                                boid0.getPosition().
                                        subtract(boid1.getPosition()).scale(closeness).
                                        scale(speed)
                        );
                    }
                }
                //normalize separation to cap at speed
                if (separation.magnitude() > 1) {
                    separation = separation.normalize();
                }

                //Calculate steering as combination of all steering behaviors
                var steeringDir = new Vector330();
                steeringDir = steeringDir.add(alignmentDir.scale(alignmentWeight));
                steeringDir = steeringDir.add(cohesionDir.scale(cohesionWeight));
                steeringDir = steeringDir.add(separation.scale(separationWeight));
                steeringDir = steeringDir.normalize();
                if (steeringDir.equals(new Vector330())) {
                    //If there is no steering, don't change direction and just go toward desired speed
                    steeringDir = boid0.getVelocity().normalize();
                }
                steering = steeringDir.scale(speed);
            }
            var totalWeight = steeringWeight + currentVelocityWeight;
            //Now merge with current velocity
            double lerp = (steeringWeight / totalWeight) * deltaTime;
            var finalVec = steering
                    .scale(lerp).
                    add(boid0.getVelocity().scale(1 - lerp));
            boid0.bufferVelocity(finalVec);
        }

        evasionTimer -= deltaTime;
    }

    /**
     * Set position to evade.
     *
     * @param evasionPoint
     */
    public void evade(Vector330 evasionPoint) {
        this.evasionPoint = evasionPoint;
        evasionTimer = evasionDuration;
    }


    /**
     * Add a boid to this flock.
     * @param boid
     */
    public void addBoid(Boid boid) {
        boids.add(boid);
        if (gameSettings == null)
            return; //Only run following code if initialized
        applyPhaseRatioAll();
        applySize(boid);
        applyAesthetic(boid);
    }


    /**
     * Gets the name of the flock.
     * @return the flock's name.
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the name of the flock.
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Sets the name of the flock.
     * @param name
     */
    public  void SetName(String name) {
        this.name = name;
    }

    /**
     * Sets the radius for alignment steering behaviors.
     *
     * @param alignmentRadius
     */
    public void setAlignmentRadius(double alignmentRadius) {
        this.alignmentRadius = alignmentRadius;
    }

    /**
     * Sets the radius for cohesion steering behaviors.
     *
     * @param cohesionRadius
     */
    public void setCohesionRadius(double cohesionRadius) {
        this.cohesionRadius = cohesionRadius;
    }

    /**
     * Sets the radius for evasion steering behaviors.
     *
     * @param evasionRadius
     */
    public void setEvasionRadius(double evasionRadius) {
        this.evasionRadius = evasionRadius;
    }

    /**
     * Sets the radius for separation steering behaviors. If negative, will use the boid's size instead.
     *
     * @param separationRadius
     */
    public void setSeparationRadius(double separationRadius) {
        this.separationRadius = separationRadius;
    }

    /**
     * Sets the weight for alignment steering behavior.
     *
     * @param alignmentWeight
     */
    public void setAlignmentWeight(double alignmentWeight) {
        this.alignmentWeight = alignmentWeight;
    }

    /**
     * Sets the weight for cohesion steering behavior.
     *
     * @param cohesionWeight
     */
    public void setCohesionWeight(double cohesionWeight) {
        this.cohesionWeight = cohesionWeight;
    }

    /**
     * Sets the weight for current velocity merging with steering behaviors.
     *
     * @param currentVelocityWeight
     */
    public void setCurrentVelocityWeight(double currentVelocityWeight) {
        this.currentVelocityWeight = currentVelocityWeight;
    }

    /**
     * Sets the weight for separation steering behavior.
     *
     * @param separationWeight
     */
    public void setSeparationWeight(double separationWeight) {
        this.separationWeight = separationWeight;
    }

    /**
     * Change the speed of the flock.
     * @param speed
     */
    public void setSpeed (double speed) {
        this.speed = speed;
    }

    /**
     * Gets the speed of the flock.
     * @return
     */
    public double getSpeed() {
        return speed;
    }

    public double getPhaseRatio() {
        return this.phaseRatio;
    }
    /**
     * Sets the proportion of boids in flock who phase instead of bounce on edges.
     * @param phaseRatio
     */
    public void setPhaseRatio(double phaseRatio) {
        this.phaseRatio = phaseRatio;
        applyPhaseRatioAll();
    }

    /**
     * Applies the edge behavior based on phaseRatio to all boids in flock.
     */
    private void applyPhaseRatioAll() {
        int maxPhaseIndex = (int)Math.floor(phaseRatio * boids.size());
        int i = 0;
        for (Boid boid0 : boids) {
            if (i < maxPhaseIndex) {
                boid0.setEdgeBehavior(Boid.EdgeBehavior.PHASE);
            }
            else {
                boid0.setEdgeBehavior(Boid.EdgeBehavior.BOUNCE);
            }
            i++;
        }
    }

    /**
     * Sets the evasion weight.
     * @param weight an integer representing weight
     */
    public  void setEvasionWeight(double weight) {
        evasionWeight = weight;
    }

    /**
     * Gets the evasion weight of the flock.
     * @return
     */
    public double getEvasionWeight() {
        return evasionWeight;
    }

    /**
     * Gets the average size of boids in this flock
     * @return
     */
    public int getAverageSize() {
        return averageSize;
    }

    /**
     * Sets the average size of boids in this flock.
     * @param averageSize
     */
    public void setAverageSize(int averageSize) {
        if (averageSize == this.averageSize)
            return;
        this.averageSize = averageSize;

        if(gameSettings == null)
            return;

        for (var boid : boids) {
            applySize(boid);
        }
    }

    private void applySize(Boid boid) {
        int sizeVariance = (int)(Math.min(1,Math.ceil(averageSize * .1d)));
        boid.setSize(Math.max(1,averageSize +
                gameSettings.rand.nextInt(-sizeVariance,sizeVariance + 1) ));
    }

    /**
     * Gets the aesthetic of boids in this flock.
     * @return
     */
    public BoidAesthetic getAesthetic() {
        return aesthetic;
    }

    public void setAesthetic (BoidAesthetic aesthetic) {
        this.aesthetic = aesthetic;
        for (var boid : boids) {
            applyAesthetic(boid);
        }
    }
    private void applyAesthetic (Boid boid) {
        this.aesthetic.apply(boid);
    }

    /**
     * Gets the number of boids in the flock.
     * @return number of boids.
     */
    public int getCount() {
        return boids.size();
    }

    /**
     * Sets the number of boids to ensure on the next frame.
     * @param count
     */
    public void setTargetCount(int count) {
        this.targetCount = count;

    }

    /**
     * Ensure the number of boids in the flock matches the set count through creation or deletion.
     */
    private void applyTargetCount() {
        int diff = targetCount - getCount();
        if (diff > 0) {
            //Too few boids. Create more
            for (int i = 0; i < diff; i++) {
                this.addBoid(gameSettings.simulation.createBoid());
            }
        }
        else if (diff < 0) {
            //Too many boids. Delete
            for (int i = 0; i < -diff; i++) {
                int index = boids.size() - 1;
                gameSettings.simulation.removeBoid(boids.get(index));
                boids.remove(index);
            }
        }
    }
}
