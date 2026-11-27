/**
 * Instantiates a Simulation and sets up Dusky Sky Birds scene.
 * Documentation Statement: None
 * @author C24John.Pan
 */
public class Main {
    public static void main(String[] args) {
        //Create UI
        var flockMenu = FlockMenu.SetupMenu();
        //Set up simulation
        var sim = DuskSkyBirds.SetupSim();

        var listener = new SimulationMenuListener(sim,flockMenu);
        sim.start();


        System.exit(0);
    }



}