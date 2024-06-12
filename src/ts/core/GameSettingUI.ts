import { World } from '../sketchbook';
import { UIManager } from './UIManager';
import { CannonDebugRenderer } from '../../lib/cannon/CannonDebugRenderer';

export const initSettingUI = (world: World) => {
    // Game setting panel
    const gameSettingElement = document.getElementById('gameSetting');
    gameSettingElement.style.display = 'flex';

    // GearIcon
    const gearIconElement = document.getElementById('gearIcon');
    gearIconElement.addEventListener('click', () => {
      const settingPanel = document.getElementById('settingPanel');
      settingPanel.style.display = 'flex'
    })

    // Okay button
    const settingOkayBtn = document.getElementById('setting-okay');
    settingOkayBtn.addEventListener('click', () => {
        const settingPanel = document.getElementById('settingPanel');
        settingPanel.style.display = 'none'
    })

    // Reset button
    const settingResetBtn = document.getElementById('setting-reset');
    settingResetBtn.addEventListener('click', () => {
      // UI part
      const shadowInput = <HTMLInputElement> document.getElementById('setting-shadow');
      const physicsInput = <HTMLInputElement> document.getElementById('setting-physics');
      const detectionInput = <HTMLInputElement> document.getElementById('setting-detection');
      const mouseInput = <HTMLInputElement> document.getElementById('setting-mouse');
      const aaInput = <HTMLInputElement> document.getElementById('setting-AA');
      const pointerInput = <HTMLInputElement> document.getElementById('setting-pointer');
      const fpsInput = <HTMLInputElement> document.getElementById('setting-fps');
      shadowInput.checked = true;
      physicsInput.checked = false;
      detectionInput.checked = true;
      mouseInput.value = '0.3';
      aaInput.checked = true;
      pointerInput.checked = false;
      fpsInput.checked = false;

      // Functaional part
      World.params.Shadows = true;
      world.sky.csm.lights.forEach((light) => {
        light.castShadow = true;
      });

      World.params.Debug_Physics = false;
      if (!world.cannonDebugRenderer) world.cannonDebugRenderer = new CannonDebugRenderer( world.graphicsWorld, world.physicsWorld );
      world.cannonDebugRenderer.clearMeshes();
      world.cannonDebugRenderer = undefined;
      world.characters.forEach((char) =>
      {
        char.raycastBox.visible = false;
      });

      // World.params.realtimeDetect = true;

      World.params.Mouse_Sensitivity = 0.3;
      world.cameraOperator.setSensitivity(0.3, 0.3 * 0.8);

      World.params.FXAA = true;

      World.params.Pointer_Lock = true;
      world.inputManager.setPointerLock(true);

      World.params.Debug_FPS = false;
      UIManager.setFPSVisible(false);
    })

    // Change events
    handleChangeSetting(world);
}

const handleChangeSetting = (world: World) => {
  // Shadow
  const shadowInput = <HTMLInputElement> document.getElementById('setting-shadow');
  shadowInput.addEventListener('change', () => {
    if (shadowInput.checked)
      {
        World.params.Shadows = true;
        world.sky.csm.lights.forEach((light) => {
          light.castShadow = true;
        });
      }
      else
      {
        World.params.Shadows = false;
        world.sky.csm.lights.forEach((light) => {
          light.castShadow = false;
        });
      }
  })


  // Physics
  const physicsInput = <HTMLInputElement> document.getElementById('setting-physics');
  physicsInput.addEventListener('change', () => {
    if (physicsInput.checked)
      {
        World.params.Debug_Physics = true;
        world.cannonDebugRenderer = new CannonDebugRenderer( world.graphicsWorld, world.physicsWorld );
      }
      else
      {
        World.params.Debug_Physics = false;
        world.cannonDebugRenderer.clearMeshes();
        world.cannonDebugRenderer = undefined;
      }
      world.characters.forEach((char) =>
      {
        char.raycastBox.visible = physicsInput.checked;
      });
  })

  // Realtime detection
  const detectionInput = <HTMLInputElement> document.getElementById('setting-detection');
  detectionInput.addEventListener('change', () => {
    World.params.realtimeDetect = detectionInput.checked;
  })

  // Mouse sensitivity
  const mouseInput = <HTMLInputElement> document.getElementById('setting-mouse');
  mouseInput.addEventListener('change', () => {
    World.params.Mouse_Sensitivity = Number(mouseInput.value);
    world.cameraOperator.setSensitivity(Number(mouseInput.value), Number(mouseInput.value) * 0.8);
  })

  // FXAA
  const aaInput = <HTMLInputElement> document.getElementById('setting-AA');
  aaInput.addEventListener('change', () => {
    World.params.FXAA = aaInput.checked;
  })

  // Pointer lock
  const pointerInput = <HTMLInputElement> document.getElementById('setting-pointer');
  pointerInput.addEventListener('change', () => {
    World.params.Pointer_Lock = !pointerInput.checked;
    world.inputManager.setPointerLock(!pointerInput.checked);
  })

  // FPS
  const fpsInput = <HTMLInputElement> document.getElementById('setting-fps');
  fpsInput.addEventListener('change', () => {
    World.params.Debug_FPS = fpsInput.checked;
    UIManager.setFPSVisible(fpsInput.checked);
  })
}