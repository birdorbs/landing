import java.awt.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Random;

/**
 * Sets up the scene for Dusk Sky Birds.
 */
public class DuskSkyBirds {

    private static BoidAesthetic[] cachedAesthetics;

    /**
     * Gets array of aesthetics used in this scene.
     *
     * @return Array of aesthetics used int this scene.
     */
    public static BoidAesthetic[] getAesthetics() {
        if (cachedAesthetics == null) {
            var r = new Random();

            var list = new ArrayList<BoidAesthetic>();

            list.add(new BoidAesthetic("Default"));

            var butterflyAesthetic = new BoidAesthetic("Butterfly").
                    setWingSize(5).
                    setColor(new Color(
                            r.nextFloat(),
                            r.nextFloat(),
                            r.nextFloat())).
                    setWingStartAngle(r.nextInt(30, 60)).
                    setWingArcAngle(r.nextInt(120, 180));
            list.add(butterflyAesthetic);

            var batAesthetic = new BoidAesthetic("Bat").
                    setColor(Color.black).
                    setWingStartAngle(40).
                    setWingArcAngle(130);
            list.add(batAesthetic);

            var spiritAesthetic = new BoidAesthetic("Spirit").
                    setColor(new Color(200, 170, 200, 70)).
                    setWingSize(24).
                    setWingStartAngle(0).
                    setWingArcAngle(180).
                    setWingFlapPeriod(1.5);
            list.add(spiritAesthetic);

            var hummingbirdAesthetic = new BoidAesthetic("Hummingbird").
                    setColor(new Color(10, 10, 240)).
                    setWingStartAngle(55).
                    setWingArcAngle(160).
                    setWingFlapPeriod(.05);
            list.add(hummingbirdAesthetic);

            var cardinalAesthetic = new BoidAesthetic("Cardinal").
                    setWingStartAngle(40).
                    setWingArcAngle(160).
                    setColor(new Color(240, 10, 10));
            list.add(cardinalAesthetic);

            var budgerigarAesthetic = new BoidAesthetic("Budgerigar").
                    setWingStartAngle(75).setWingArcAngle(120).setColor(new Color(10, 240, 10));
            list.add(budgerigarAesthetic);

            var doveAesthetic = new BoidAesthetic("Dove").
                    setColor(new Color(255, 200, 200)).setWingStartAngle(30).
                    setWingArcAngle(170);
            list.add(doveAesthetic);

            cachedAesthetics = new BoidAesthetic[list.size()];
            cachedAesthetics = list.toArray(cachedAesthetics);
        }
        return cachedAesthetics;
    }


    /**
     * Sets up the Dusk Sky Bird scene.
     *
     * @return A new simulation
     */
    public static Simulation SetupSim() {
        var aesthetics = getAesthetics();
        var butterflyAesthetic = Arrays.stream(aesthetics).filter(a -> a.getName().equalsIgnoreCase("Butterfly")).findFirst().get();
        var batAesthetic = Arrays.stream(aesthetics).filter(a -> a.getName().equalsIgnoreCase("Bat")).findFirst().get();
        var spiritAesthetic = Arrays.stream(aesthetics).filter(a -> a.getName().equalsIgnoreCase("spirit")).findFirst().get();
        var hummingbirdAesthetic = Arrays.stream(aesthetics).filter(a -> a.getName().equalsIgnoreCase("Hummingbird")).findFirst().get();
        var cardinalAesthetic = Arrays.stream(aesthetics).filter(a -> a.getName().equalsIgnoreCase("Cardinal")).findFirst().get();
        var budgerigarAesthetic = Arrays.stream(aesthetics).filter(a -> a.getName().equalsIgnoreCase("Budgerigar")).findFirst().get();
        var doveAesthetic = Arrays.stream(aesthetics).filter(a -> a.getName().equalsIgnoreCase("Dove")).findFirst().get();



        Simulation sim = new Simulation("Dusk Sky Birds");
        var r = sim.getGameSettings().rand;

        //The moon
        for (int i = 0; i < 1; i++) {
            var boid = new Boid();
            sim.initializeBoid(boid);
            boid.setSize(100);
            var color = new Color(220, 231, 191, 190);
            boid.setColor(color);
            boid.bufferSpeed(2);
            boid.setWingSize(115);
            boid.setWingArcAngle(180);
            boid.setWingStartAngle(0);
            boid.setWingFlapPeriod(1000000);
            //Place the moon center-ish
            boid.setPosition(new Vector330(
                    sim.getGameSettings().screenWidth / 2 * (1.25 - r.nextDouble(.5)),
                    sim.getGameSettings().screenHeight / 2 * (1.25 - r.nextDouble(.5))
            ));
        }


        //Buncha butterflies in background
        int butterflyFlockCount = r.nextInt(200,250);
        for (int j = 0; j < butterflyFlockCount; j++) {
            butterflyAesthetic.setColor(new Color(
                    r.nextFloat(),
                    r.nextFloat(),
                    r.nextFloat()));
            var boid = sim.createBoid();
            boid.setSize(1);
            butterflyAesthetic.apply(boid);
        }

        //spooky bats

        for (int j = 0; j < 5; j++) {
            Flock batFlock = new Flock("Bats" + String.valueOf(j), r.nextDouble(50, 70));
            batFlock.setTargetCount(r.nextInt(14, 18));
            batFlock.setAesthetic(batAesthetic);
            batFlock.setAverageSize(7);
            batFlock.setPhaseRatio(1);
            batFlock.setSeparationRadius(20);
            sim.bufferInitializeFlock(batFlock);
        }

        //spooky spookies
        Flock spiritFlock = new Flock("Spirit", 180);
        spiritFlock.setTargetCount(5);

        spiritFlock.setAesthetic(spiritAesthetic);
        spiritFlock.setAverageSize(14);
        spiritFlock.setPhaseRatio(1);
        spiritFlock.setAlignmentWeight(10);
        spiritFlock.setCohesionWeight(120);
        spiritFlock.setSeparationRadius(90);
        spiritFlock.setSeparationWeight(120);
        spiritFlock.setCohesionRadius(200);
        sim.bufferInitializeFlock(spiritFlock);

        //flappy blue birds

        int hummingbirdsCount = r.nextInt(4, 6);
        for (int j = 0; j < hummingbirdsCount; j++) {
            Flock hummingbirdFlock = new Flock("Hummingbirds" + String.valueOf(j), 150);
            int count = r.nextInt(14, 18);
            hummingbirdFlock.setTargetCount(count);
            hummingbirdFlock.setAesthetic(hummingbirdAesthetic);
            hummingbirdFlock.setAverageSize(4);
            hummingbirdFlock.setPhaseRatio(.3);
            hummingbirdFlock.setAlignmentWeight(60);
            hummingbirdFlock.setCohesionRadius(400);
            hummingbirdFlock.setCohesionWeight(20);
            sim.bufferInitializeFlock(hummingbirdFlock);
        }

        //pretty red birds
        int cardinalsCount = r.nextInt(3, 5);
        for (int j = 0; j < cardinalsCount; j++) {
            Flock cardinalFlock = new Flock(
                    "Cardinals" + String.valueOf(j),
                    r.nextDouble(150, 190));
            int count = r.nextInt(11, 15);
            cardinalFlock.setTargetCount(count);
            cardinalFlock.setAesthetic(cardinalAesthetic);
            cardinalFlock.setAverageSize(7);
            cardinalFlock.setPhaseRatio(.4);
            cardinalFlock.setCurrentVelocityWeight(20);
            cardinalFlock.setSeparationRadius(18);
            sim.bufferInitializeFlock(cardinalFlock);
        }

        //pretty green birds
        {

            int budgerigarsCount = r.nextInt(2, 3);
            for (int j = 0; j < budgerigarsCount; j++) {
                Flock budgerigarFlock = new Flock(
                        "Budgerigar" + String.valueOf(j),
                        r.nextDouble(120, 140));
                int count = r.nextInt(11, 14);
                budgerigarFlock.setTargetCount(count);
                budgerigarFlock.setAesthetic(budgerigarAesthetic);
                budgerigarFlock.setAverageSize(8);
                budgerigarFlock.setCohesionWeight(100);
                budgerigarFlock.setAlignmentWeight(300);
                budgerigarFlock.setSeparationWeight(300);
                sim.bufferInitializeFlock(budgerigarFlock);
            }
        }

        //love birds

        for (int j = 0; j < 1; j++) {
            Flock doveFlock = new Flock("Doves" + String.valueOf(j), 120);

            doveFlock.setAesthetic(doveAesthetic);
            doveFlock.setTargetCount(2);
            doveFlock.setAverageSize(8);
            doveFlock.setPhaseRatio(.5);
            doveFlock.setCohesionRadius(Integer.MAX_VALUE);
            doveFlock.setSeparationRadius(30); //set good boundaries for a healthy relationship
            doveFlock.setSeparationWeight(115);
            doveFlock.setCohesionWeight(110);
            doveFlock.setAlignmentWeight(50);
            sim.bufferInitializeFlock(doveFlock);
        }
        return sim;
    }
}
