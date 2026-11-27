

import javax.swing.*;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;
import javax.swing.event.PopupMenuEvent;
import javax.swing.event.PopupMenuListener;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.*;

/**
 * Listens for input from GUI and interacts with simulation.
 * @author C24John.Pan
 */
public final class SimulationMenuListener implements ActionListener, ChangeListener, PopupMenuListener {
    private FlockMenu flockMenu;
    private Simulation simulation;

    private ArrayList<BoidAesthetic> aesthetics;

    private Flock curFlock;

    /**
     * Create a new instance of this class.
     * @param simulation the simulation
     * @param flockMenu the GUI
     */
    public SimulationMenuListener(Simulation simulation, FlockMenu flockMenu) {
        this.simulation = simulation;
        this.flockMenu = flockMenu;

        //Listen to button actions
        flockMenu.addButton.addActionListener(this);
        flockMenu.deleteButton.addActionListener(this);
        flockMenu.saveButton.addActionListener(this);
        flockMenu.pauseButton.addActionListener(this);
        flockMenu.restartButton.addActionListener(this);
        flockMenu.exitButton.addActionListener(this);

        //Update the flock selection options every time it's opened
        flockMenu.flockSelect.addPopupMenuListener(this);
        flockMenu.flockSelect.addActionListener(this);

        //Update the aesthetic options
        aesthetics = new ArrayList<>(Arrays.asList(DuskSkyBirds.getAesthetics()));
        var listModel = new DefaultListModel();
        for (var aesthetic : aesthetics) {
            listModel.addElement(aesthetic.getName());
        }
        flockMenu.aestheticSelect.setModel(listModel);
        flockMenu.aestheticSelect.setSelectedIndex(0);

        waitAndUpdate();

    }

    /**
     * Loads values from the flock to the menu.
     * @param f flock
     */
    private void flockToMenu(Flock f) {
        flockMenu.nameField.setText(f.getName());
        flockMenu.phaseSlider.setValue((int)Math.round(f.getPhaseRatio() * 100));
        flockMenu.sizeSlider.setValue(f.getAverageSize());
        flockMenu.speedSlider.setValue((int)Math.ceil(f.getSpeed()));
        flockMenu.countSlider.setValue(f.getCount());

        //Update aesthetic selection
        flockMenu.aestheticSelect.clearSelection();
        var aestheticName = f.getAesthetic().getName();
        int aestheticIndex = -1;
        for (int i= 0; i < aesthetics.size(); i++) { //linear search for name
            if (aesthetics.get(i).getName().equalsIgnoreCase(aestheticName)) {
                aestheticIndex = i;
                break;
            }
        }
        if (aestheticIndex > 0) {
            flockMenu.aestheticSelect.setSelectedIndex(aestheticIndex);
        }

        flockMenu.alignmentRadius.setValue((int)Math.round(f.alignmentRadius));
        flockMenu.cohesionWeight.setValue((int)Math.round(f.alignmentWeight));

        flockMenu.cohesionRadius.setValue((int)Math.round(f.cohesionRadius));
        flockMenu.cohesionWeight.setValue((int)Math.round(f.cohesionWeight));

        flockMenu.seperationRadius.setValue((int)Math.round(f.separationRadius));
        flockMenu.separationWeight.setValue((int)Math.round(f.separationWeight));

        flockMenu.evasionRadius.setValue((int)Math.round(f.evasionRadius));
        flockMenu.evasionWeight.setValue((int)Math.round(f.evasionWeight));
    }

    /**
     * Applies values from the menu to the flock.
     * @param f flock
     */
    private void menuToFlock(Flock f) {
        f.setName(flockMenu.nameField.getText());
        f.setPhaseRatio(flockMenu.phaseSlider.getValue());
        f.setAverageSize(flockMenu.sizeSlider.getValue());
        f.setSpeed(flockMenu.speedSlider.getValue());
        f.setTargetCount(flockMenu.countSlider.getValue());
        if(flockMenu.aestheticSelect.getSelectedIndex() < 0) {
            flockMenu.aestheticSelect.setSelectedIndex(0);
        }
        f.setAesthetic(aesthetics.get(flockMenu.aestheticSelect.getSelectedIndex()));

        f.setAlignmentRadius(flockMenu.alignmentRadius.getValue());
        f.setAlignmentWeight(flockMenu.alignmentWeight.getValue());

        f.setCohesionRadius(flockMenu.cohesionRadius.getValue());
        f.setCohesionWeight(flockMenu.cohesionWeight.getValue());

        f.setSeparationRadius(flockMenu.seperationRadius.getValue());
        f.setSeparationWeight(flockMenu.separationWeight.getValue());

        f.setEvasionRadius(flockMenu.evasionRadius.getValue());
        f.setEvasionWeight(flockMenu.evasionWeight.getValue());
    }

    private Flock findFlock(int selectionIndex) {
        var flockName = flockMenu.flockSelect.getItemAt(selectionIndex);
        var flock = simulation.getFlock(selectionIndex);
        return flock;
    }
    @Override
    public void actionPerformed(ActionEvent e) {
        var command = (e.getActionCommand());
        Flock flock;
        switch(command) {
            case "Pause":
                simulation.togglePause();
                break;
            case "Restart":
                var newSim = DuskSkyBirds.SetupSim();
                simulation.endAndQueue(newSim);
                simulation = newSim;
                waitAndUpdate();
                break;
            case "Exit":
                simulation.end();
                break;
            case "Save":
                flock = findFlock(flockMenu.flockSelect.getSelectedIndex());
                if (flock != null) {
                    menuToFlock(flock);
                }
                waitAndUpdate();
                break;
            case "Delete":
                flock = findFlock(flockMenu.flockSelect.getSelectedIndex());
                if (flock != null) {
                    simulation.queueRemoveFlock(flock);
                    waitAndUpdate();
                }
                break;
            case "Add":
                flock = new Flock();
                menuToFlock(flock);
                simulation.bufferInitializeFlock(flock);
                waitAndUpdate();
                break;
            case "comboBoxChanged":
                flock = findFlock(flockMenu.flockSelect.getSelectedIndex());
                if (flock != null) {
                    flockToMenu(flock);
                }
                break;
        }
    }
    private void waitAndUpdate () {
        //Wait for next frame and update GUI
        long lastFrame = simulation.getFrameCount();
        while(simulation.getFrameCount() != lastFrame) {}
        updateComboBox();
    }

    @Override
    public void stateChanged(ChangeEvent e) {

    }

    @Override
    public void popupMenuWillBecomeVisible(PopupMenuEvent e) {
        waitAndUpdate();
    }

    private void updateComboBox () {
        int index = flockMenu.flockSelect.getSelectedIndex();
        flockMenu.flockSelect.removeAllItems();
        int flockCount = simulation.GetFlockCount();
        for (int i= 0; i < flockCount; i++) {
            var flock = simulation.getFlock(i);
            if (flock == null)
            {
                //Protects against race condition where combo box is updated after last flock is deleted
                break;
            }
            flockMenu.flockSelect.addItem(simulation.getFlock(i).getName());
        }
        flockMenu.flockSelect.setSelectedIndex(index);
    }

    @Override
    public void popupMenuCanceled(PopupMenuEvent e) {}
    @Override
    public void popupMenuWillBecomeInvisible(PopupMenuEvent e) { }
}
