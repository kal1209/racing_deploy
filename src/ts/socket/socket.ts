import * as THREE from 'three';
import { Character } from '../characters/Character';
import { LoadingManager } from '../core/LoadingManager';
import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import { World } from '../sketchbook';
import { MyCharacter } from '../world/Player/Player';
import { io } from 'socket.io-client';
import { enableCharacterUpdate, enableVehicleUpdate } from '../world/World';
import { Result } from '../world/Result';
import * as CANNON from 'cannon';
import { UIManager } from '../core/UIManager';
import { Vector2 } from 'three';
import { init } from '../core/StartGameUI';
import { initSettingUI } from '../core/GameSettingUI';
import { onReadyServer, startRace, createGameRoomTableRow } from '../core/StartGameUI';
import { Bubble } from '../world/Bubble/NameBubble';
import { OnFinishRace } from '../core/FinishRace';

// export const socket = io('http://localhost:8080', {
export const socket = io('https://dev-racer.coinstash.games/', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true
});
export let mySid;
export const timeStamp = 200;

export let playersList_;
var isReady = false;
let keyEvent;
let detectObj;
let index = 0;
let instanceWorld: World;
let playerNumber;

export const InitSocket = (world: World) => {
    instanceWorld = world;
    socket.on('connect', () => {
        console.log('connected, will start working');
        init();
        initSettingUI(instanceWorld);
    })

    socket.on('disconnect', () => {

    })

    socket.on('timerUpdate', (formattedTime) => {
        if (!Result.gameOver) {
            // Update the timer display with the received time
            const container = document.getElementById('lobby-timer-container');
            let text1 = container.querySelector('.timer');
            let text2 = container.querySelector('.timerMain');

            if (!text1) {
                text1 = document.createElement('div');
                text1.classList.add('timer');
                text2 = document.createElement('div');
                text2.classList.add('timerMain');
                container.appendChild(text1);
                container.appendChild(text2);
            }

            text1.textContent = "02:00:00  Race Length";
            text2.textContent = formattedTime + "  Elaspsed Time";
        }
    });

    socket.on('raceUpdate', (info) => {
        // Update the timer display with the received time
        let timeOut = false;
        instanceWorld.players.forEach((player, index) => {
            if (player.mySid === info.sid) player.status = 'finish';
        });
        OnFinishRace(info.pos, info.time, info.sid, info.name, instanceWorld, timeOut);
        Result.section++;
    });

    socket.on('timeOut', (finishCount) => {
        let timeOut = true;
        instanceWorld.players.forEach((player, index) => {
            if (player.status !== 'finish') OnFinishRace(index + finishCount, '02:00', instanceWorld.players[index].mySid, instanceWorld.players[index].name, instanceWorld, timeOut);
        })
    })

    socket.on('existingRoom', (rooms) => {
        rooms.forEach(room => {
            createGameRoomTableRow('join', room);
        });
    })

    socket.on('createRoom', (info) => {
        if (info.sid !== mySid) {
            createGameRoomTableRow('join', info); // Add game room table row.
        }
    })

    socket.on('joinRoom', (rooms) => {
        const gameRoomTableBody = document.getElementById('gameRoomTableBody');
        gameRoomTableBody.innerHTML = '';
        rooms.forEach(room => {
            createGameRoomTableRow('join', room);
        });
    })
}

export const createRoom = (roomId, price) => {
    let info = {
        roomId: roomId,
        price: price,
        creator: World.myName,
        sid: mySid,
        member: 1,
    }
    socket.emit('createRoom', info);
    World.roomId = info.roomId;

    // Show wallet page
    const roomPage = document.getElementById('roomDiv');
    roomPage.style.display = "none";
    const walletPage = document.getElementById('wallet-page');
    walletPage.style.display = "flex";
}

export const joinRoom = (roomInfo) => {
    roomInfo.member++;
    socket.emit('joinRoom', roomInfo);
    World.roomId = roomInfo.roomId;

    // Show wallet page
    const roomPage = document.getElementById('roomDiv');
    roomPage.style.display = "none";
    const walletPage = document.getElementById('wallet-page');
    walletPage.style.display = "flex";
}

export const startMultiPlayerRacing = () => {
    // Start the multiplayer racing
    instanceWorld.mode = 'racing';
    let tabs: any = document.getElementsByClassName('tabs');
    tabs[0].style.display = 'none';
    World.enablePressButton = false;

    let defaultScenarioID: string;
    for (const scenario of instanceWorld.scenarios) {
        if (scenario.default) {
            defaultScenarioID = scenario.id;
            break;
        }
    }
    if (defaultScenarioID !== undefined) {
        instanceWorld.players[0].scenario = defaultScenarioID;
        ReportJoin(instanceWorld);
        let loadingManager = new LoadingManager(instanceWorld);
        instanceWorld.launchScenario(defaultScenarioID, loadingManager);

        const ready = document.getElementById('ready');
        ready.style.display = "flex";
    }
}

export const setUserName = () => {
    let info = {
        sid: mySid,
        name: World.myName,
        roomId: World.roomId
    }
    socket.emit('setUserName', info);

    socket.on('setUserName', (data) => {
        instanceWorld.players.forEach((player, index) => {
            if ((player.mySid === data.sid)) {
                player.name = data.name;
                if (index !== 0) {
                    if (player.character) {
                        let bubble = new Bubble(data.name, player.character, instanceWorld, player.color);
                        player.bubble = bubble;
                        instanceWorld.registerBubbles(bubble);
                    }
                }
            }
        })
    })
}

export const StartTimer = () => {
    let startTime = Date.now();
    const timerInterval = setInterval(() => {
        const elapsedTimeInSeconds = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsedTimeInSeconds / 60);
        const seconds = elapsedTimeInSeconds % 60;
        // Emit timer update to all clients
        socket.emit('timerUpdate', { data: `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`, roomId: World.roomId });
    }, 1000);
}


export const SetReady = () => {
    socket.on('startRace', () => {
        UIManager.setLobbyUIVisible(false);
        startRace()
    });
    if (!isReady) {
        socket.emit('setReady', { mySid: mySid, roomId: World.roomId });
        isReady = true;
    }
    else {
        socket.emit('setNotReady', { mySid: mySid, roomId: World.roomId });
        isReady = false;
    }
}

export const SetNotReady = () => {
    socket.emit('setNotReady');
}

export const FinishRace = (position: Number) => {
    const container = document.getElementById('lobby-timer-container');
    let text = container.querySelector('.timerMain');

    if (text) {
        const timing = text.textContent;
        socket.emit('raceUpdate', { data: "Position :" + position + ": " + timing, sid: mySid, pos: position, time: timing, name: World.myName, roomId: World.roomId });
    }
}

export const ReceiveMySid = (OneCharacter: MyCharacter) => {
    socket.on('yourSid', (sid) => {
        OneCharacter.mySid = sid;
        mySid = sid;
    })
}

export const ReportJoin = (world: World) => {
    // instanceWorld = world;
    let OneCharacter = world.players[0];

    let reportData = {
        name: OneCharacter.name,
        mySid: OneCharacter.mySid,
        position: OneCharacter.position,
        rotation: OneCharacter.rotation,
        color: OneCharacter.color,
        scenario: OneCharacter.scenario,
        roomId: World.roomId,
    };

    socket.emit('join', reportData);

    socket.on('disconnectOne', (sid) => {
        world.players.forEach((player) => {
            if (player.mySid === sid) {
                if (player.character) world.remove(player.character);
                if (player.character.controlledObject) {
                    world.vehicles.forEach((vehicle) => {
                        if (vehicle.sid === sid) world.remove(vehicle);
                    })
                }
                if (player.bubble) {
                    world.unregisterBubbles(player.bubble);
                    world.graphicsWorld.remove(player.bubble.bubble.obj);
                }
                world.players.splice(world.players.indexOf(player), 1);
            }
        })
    })
}

export const createModels = (world: World, scenarioId: string, loadingManager: LoadingManager, sp: ISpawnPoint) => {
    let players = world.players;
    if (players[0] && players[1] && (players[0].name === players[1].name) && players[1].mySid === undefined) {
        players[1].mySid = players[0].mySid;
        players.splice(0, 1);
        world.players = players;
    }

    socket.on('createModels', (userData) => {
        if (userData.mySid !== mySid) {
            let player = new MyCharacter(userData);
            player.mySid = userData.mySid;
            player.scenario = scenarioId;
            players.push(player);
        }

        if (mySid === userData.mySid) playerNumber = userData.playerIndex;

        let playerIndex = players.length - 1;
        if (sp.driver === 'character') {
            sp.spawn(loadingManager, world, players, userData, playerIndex);
        }
    })

    socket.on('askPosition', (sid) => {
        let info = {
            position: players[0].position,
            rotation: players[0].rotation,
            sid: sid,
            mySid: mySid,
            name: players[0].name,
            color: players[0].color,
            playerIndex: playerNumber
        };
        if (sid !== mySid) socket.emit('answerPosition', info);
    })

    socket.on('playerJoined', (playerList) => {
        playersList_ = playerList;
        for (let i = 0; i < playerList.length; i++) {
            socket.emit('checkReady', mySid, i);
        }
    })

    socket.on('checkReady', (data) => {
        if (instanceWorld.mode !== 'hub') {
            onReadyServer(data.id, data.isReady);
        }
    })

    socket.on('answerPosition', (info) => {
        let player = new MyCharacter(info);
        player.scenario = scenarioId;
        player.mySid = info.mySid;
        players.push(player);
        let playerIndex = players.length - 1;
        sp.spawn(loadingManager, world, players, info, playerIndex);
    })
}

export const pressKeyboard = (event: KeyboardEvent, code: string, world: World, pressed: boolean) => {
    if (World.enablePressButton) {
        if ((code === 'KeyF') && !world.players[0].character.controlledObject) World.enablePressButton = false;
        let viewVector = world.players[0].character.viewVector;
        let data = JSON.stringify({ keyCode: code, sid: mySid, roomId: World.roomId, pressed: pressed, viewVector: viewVector });
        keyEvent = event;
        socket.emit('pressKeyboard', data);
    }
}

export const moveCharacters = (world: World) => {
    socket.on('moveCharacters', (info) => {
        let parsedData = JSON.parse(info);
        // if (parsedData.sid === mySid) { 
        world.players.forEach((player, index) => {
            if (player.mySid === parsedData.sid) {
                player.character.setViewVector(parsedData.viewVector);
                if (parsedData.keyCode === 'KeyF') {
                    world.changeEnableCharacter(false);
                    world.changeEnableVehicle(true);
                    World.params[`Sync_Vehicle_Enable`] = true;
                }

                if (!player.character.controlledObject || (index === 0)) player.character.handleKeyboardEvent(keyEvent, parsedData.keyCode, parsedData.pressed);

                // Turn on/off tail lights
                if (player.character.controlledObject) {
                    if ((parsedData.keyCode === 'KeyS') || (parsedData.keyCode === 'Space')) {
                        if (parsedData.pressed) {
                            player.character.controlledObject.modelContainer.children[0].children.forEach((child) => {
                                if ((<any>child).isMesh && child.name === 'tail_light') {
                                    const turnOnMat = new THREE.MeshPhysicalMaterial({
                                        transparent: true,
                                        opacity: 1,
                                        color: 'rgb(200, 0, 0)',
                                        emissive: new THREE.Color('red'),
                                    });
                                    (<any>child).material = turnOnMat;
                                }
                            })
                        } else {
                            player.character.controlledObject.modelContainer.children[0].children.forEach((child) => {
                                if ((<any>child).isMesh && child.name === 'tail_light') {
                                    const turnOffMat = new THREE.MeshPhysicalMaterial({
                                        transparent: true,
                                        opacity: 0.5,
                                        color: 'rgb(50, 0, 0)',
                                    });
                                    (<any>child).material = turnOffMat
                                }
                            })
                        }
                    }
                }
            }
        })
        // }
    })
}

export const changeStatus = (value: string) => {
    socket.emit('changeStatus', value);
}

export const updateCharacters = (world: World) => {
    detectObj = 'character';

    socket.on('updateCharacter', (characters) => {
        characters.forEach(character => {
            world.players.forEach(player => {
                if (player.character && player.character.sid === character.sid && player.character.sid !== mySid) {
                    player.character.detectPosition = character.position;
                    player.character.detectionStart = true;
                }
            })
        });
    })

    if (world.players[0].character && world.mode !== 'hub') {
        setInterval(() => {
            if (detectObj === 'character') {
                let info = {
                    sid: mySid,
                    position: world.players[0].character.position
                }
                let data = JSON.stringify(info);
                socket.emit('updateCharacter', data);
            }
        }, timeStamp)
    }
}

export const updateVehicles = (world: World, sid: string) => {
    if (sid === mySid) detectObj = 'vehicle';

    socket.on('updateVehicle', (vehicles) => {
        vehicles.forEach(vehicle => {
            world.players.forEach(player => {
                if (player.character && player.character.sid === vehicle.sid && player.character.sid !== mySid && player.character.controlledObject) {
                    player.character.controlledObject.detectPosition = vehicle.position;
                    if (vehicle.quaternion) player.character.controlledObject.detectQuaternion = new CANNON.Quaternion(vehicle.quaternion._x, vehicle.quaternion._y, vehicle.quaternion._z, vehicle.quaternion._w);
                    player.character.controlledObject.detectionStart = true;
                }
            })
        });
    })

    if (world.players[0].character.controlledObject && world.mode !== 'hub') {
        setInterval(() => {
            if (detectObj === 'vehicle') {
                let info = {
                    sid: mySid,
                    position: world.players[0].character.controlledObject.position,
                    quaternion: world.players[0].character.controlledObject.quaternion,
                }
                let data = JSON.stringify(info);

                socket.sendBuffer = [];
                socket.emit('updateVehicle', data);
            }
        }, timeStamp)
    }
}