import { World } from '../sketchbook';
import Swal from 'sweetalert2';
import * as $ from 'jquery';
import { SetReady, StartTimer, setUserName, createRoom, joinRoom, startMultiPlayerRacing } from '../socket/socket';
import { initConfigurator } from './Configurator';
import { initSettingUI } from './GameSettingUI';
let isKeyDisabled: boolean = true;

function handleKeyEvent(event) {
  if (isKeyDisabled) {
    event.preventDefault(); // Prevent default behavior (e.g., scrolling)
    event.stopPropagation(); // Stop event propagation to parent elements
    return false; // Stop further processing of the event
  }
}

//InitialUI
export function init() {
  const username = document.getElementById('username');
  username.style.display = 'flex';

  const usernameButton = document.getElementById('username-button');
  usernameButton.addEventListener('click', () => {
    const usernameInput: any = document.getElementById('username-input');
    let nameValue = usernameInput.value;
    World.myName = nameValue;

    setTimeout(() => {
      if (nameValue.length > 0) {
        // Hide input page
        username.style.display = 'none';

        // Show game room table
        const tabs: any = $('.tabs');
        if (tabs) {
          tabs[0].style.display = 'block';
        }

        const matchMakerElement = document.getElementById('matchMaker');
        matchMakerElement.click();

        const selectorelement = document.getElementById('selector');
        selectorelement.style.display = 'flex';

        const confirmSelectElement = document.getElementById('confirmSelect');
        confirmSelectElement.addEventListener('click', () => {
          const configuratorContainer = document.getElementById('configuratorContainer');
          if (configuratorContainer) {
            let configuratorElement = document.getElementById('configurator');
            configuratorContainer.removeChild(configuratorElement);
            configuratorContainer.style.display = 'none';
          }
        });

        World.enablePressButton = true;
      }
    }, 1000);
  })

  // Show the first tab by default
  $('.tabs-stage div').hide();
  $('.tabs-stage div:first').show();
  $('.tabs-nav li:first').addClass('tab-active');

  // Change tab class and display content
  $('.tabs-nav a').on('click', function (event) {
    event.preventDefault();
    $('.tabs-nav li').removeClass('tab-active');
    $(this).parent().addClass('tab-active');
    $('.tabs-stage div').hide();
    $($(this).attr('href')).show();
  });

  // CreateRoom button
  const createRoomButton = document.getElementById('createGameRoom');
  createRoomButton.addEventListener("click", clickCreateRoomButton);

  // Character & Vehicle configurator
  const characterSelector = document.getElementById('characterSelector');
  characterSelector.addEventListener('click', () => {
    initConfigurator('character');
  })

  const vehicleSelector = document.getElementById('vehicleSelector');
  vehicleSelector.addEventListener('click', () => {
    initConfigurator('vehicle');
  })

  // in select game, create game, change the button types
  const tabs = document.querySelectorAll('#roomDiv .tabs-nav li');

  const defaultClass = "-skew-x-12 bg-primary text-white p-1 hover:bg-primary-hover px-6";
  const activeClasses = [
    "rounded-se-2xl bg-primary hover:bg-primary-hover px-10 py-4 right-skew-top-right-radius-border text-xl",
    "bg-primary hover:bg-primary-hover px-10 py-4 left-skew-top-left-radius-border text-xl"
  ];

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();

      tabs.forEach(otherTab => {
        const anchor = otherTab.querySelector('a');
        anchor.className = defaultClass;
        otherTab.classList.remove('tab-active');
      });

      tab.classList.add('tab-active');
      const anchor = tab.querySelector('a');
      anchor.className = activeClasses[index];
    });
  });

}

export function clickCreateRoomButton() {
  if (World.enablePressButton) {
    World.enablePressButton = false;
    const feeValueElement = <HTMLInputElement>document.getElementById('feeValue');
    let feeValue = feeValueElement.value.match(/\d+/)[0];
    const matchMaker = document.getElementById('matchMaker');
    matchMaker.click();

    setTimeout(() => {
      createGameRoomTableRow('create', { price: feeValue });
    }, 300);
  }
}

export function createGameRoomTableRow(flag: string, roomInfo: any = {}) {
  const gameRoomTableBody = document.getElementById('gameRoomTableBody');
  if (gameRoomTableBody) {
    let trElement = document.createElement('tr');
    trElement.className = 'bg-black1 text-center';
    trElement.addEventListener('click', () => {
      // Change background Color
      let i = 0;
      while (gameRoomTableBody.children[i]) {
        let element = <any>gameRoomTableBody.children[i];
        element.className = 'bg-black1 text-center';
        i++;
      }
      trElement.className = 'bg-black1-hover text-center border-primary border-2';

      const createOrJoinButton = document.getElementById('joinOrCreateRoomBtn');
      if (flag === 'join') {
        createOrJoinButton.addEventListener('click', () => joinGameRoom(roomInfo));
      } else if (flag === 'create') {
        createOrJoinButton.addEventListener('click', createGameRoom);
      }
    })

    for (let index = 0; index < 5; index++) {
      let tdElement = document.createElement('td');
      switch (index) {
        case 0: // race ID
          if (flag === 'create') {
            let pElement = document.createElement('p');
            pElement.id = 'roomId';
            pElement.innerHTML = Math.ceil(Math.random() * 10000) + '';
            tdElement.appendChild(pElement);
          } else if (flag === 'join') {
            tdElement.innerHTML = roomInfo.roomId;
          }
          break;
        case 1: //  Fee
          if (flag === 'create') {
            let pElement = document.createElement('p');
            pElement.id = 'roomPrice';
            pElement.innerHTML = roomInfo.price;
            tdElement.appendChild(pElement);
          } else if (flag === 'join') {
            tdElement.innerHTML = roomInfo.price;
          }
          break;
        case 2: // Players
          if (flag === 'create') {
            tdElement.innerHTML = '1/5';
          } else if (flag === 'join') {
            tdElement.innerHTML = roomInfo.member + '/5';
          }
          break;
        case 3: // Creator
          if (flag === 'create') {
            tdElement.innerHTML = <any>World.myName;
          } else if (flag === 'join') {
            tdElement.innerHTML = roomInfo.creator;
          }
          break;
        case 4: // Ping
          if (flag === 'create') {
            let pElement = document.createElement('p');
            pElement.innerHTML = '-ms';
            tdElement.appendChild(pElement);
          } else if (flag === 'join') {
            let pElement = document.createElement('p');
            pElement.innerHTML = '-ms';
            tdElement.appendChild(pElement);
          }
          break;
        default:
          break;
      }
      trElement.appendChild(tdElement);
    }
    gameRoomTableBody.appendChild(trElement);
  }
}

function createGameRoom() {
  let roomIdInput = document.getElementById('roomId');
  let roomPriceInput = document.getElementById('roomPrice');
  if (roomIdInput.innerHTML && roomPriceInput.innerHTML) {
    let roomId = roomIdInput.innerHTML;
    let price = roomPriceInput.innerHTML;
    createRoom(roomId, price);
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Can not create Room!',
      text: 'Please input the Fee value.',
      showConfirmButton: true,
      buttonsStyling: false
    });
  }
}

function joinGameRoom(roomInfo) {
  joinRoom(roomInfo);
}

//Ui_connect
function onConnect() {
  const walletPage = document.getElementById('wallet-page');
  const statePage = document.getElementById('state-page');
  const stashPage = document.getElementById('buy-stash');
  walletPage.style.display = "none";
  statePage.style.display = "flex";
  stashPage.style.display = "flex";
  isKeyDisabled = false;
}

//UI_stash
function onStash() {
  const buyStash = document.getElementById('wallet-page');
  const joinStatus = document.getElementById('join-status');
  joinStatus.style.display = "flex";
  buyStash.style.display = "none";
}

function onJoinStatus() {
  const joinStatus = document.getElementById('join-status');
  const race = document.getElementById('race');
  race.style.display = "flex";
  joinStatus.style.display = "none";
}

//UI_race
function onRace() {
  const race = document.getElementById('race');
  race.style.display = "none";

  const selectorElement = document.getElementById('selector');
  selectorElement.style.display = "none";

  startMultiPlayerRacing();
}

//Get_Ready
function onReady() {
  World.enablePressButton = true;
  SetReady();
}

//Starting Race
export function startRace() {
  // Set Username
  setUserName();

  // Discount time
  const go = document.getElementById("go");
  const ready = document.getElementById("ready");
  go.style.display = "flex";
  ready.style.display = "none";
  var countNum = document.getElementById("countNum");
  var cnt = 3;
  var interval = setInterval(() => {
    countNum.innerHTML = `<p>${cnt ? cnt : "Go!"}</p>`;
    cnt--;
    if (cnt < 0) {
      clearInterval(interval);
      setTimeout(() => {
        const go = document.getElementById("go");
        go.style.display = "none";
        StartTimer();

        // display inGame page
        var ingame = document.getElementById('inGame');
        ingame.style.display = 'flex';

        var currentRound = document.getElementById('current-round');
        currentRound.innerHTML = 'Rounds: 1/' + World.gameRounds;
      }, 1000);
    }
  }, 1000);
}

//StartReady
export function onReadyServer(count: number, isReady: boolean) {
  count++;
  const readyPage = document.getElementById('ready');
  const player = readyPage.querySelector('tbody td:nth-child(' + count + ')');
  if (isReady) {
    player.textContent = "Ready";
  }
  else {
    player.textContent = "Joined";
  }
}

function changeTicketCount(type: string) {
  const inputElement = document.getElementById('feeValue'); // Access the input by ID
  if (inputElement instanceof HTMLInputElement) {
    let currentCount = parseInt(inputElement.value) || 0; // Parse the current number, defaulting to 0 if undefined
    if (type === 'plus')
      currentCount += 1;
    else
      currentCount -= 1;
    if (currentCount < 0) currentCount = 0; // Prevent negative numbers
    inputElement.value = `${currentCount} tickets`; // Update the input display
  }
}

window.addEventListener("load", async () => {
  init();
  // document.querySelector("#btn-wallet").addEventListener("click", onConnect);
  document.querySelector("#btn-stash").addEventListener("click", onStash);
  document.querySelector("#btn-join-status").addEventListener("click", onJoinStatus);
  document.querySelector("#btn-race").addEventListener("click", onRace);
  document.querySelector("#ticketPlus")?.addEventListener("click", () => {
    changeTicketCount('plus');
  });
  document.querySelector("#ticketMinus")?.addEventListener("click", () => {
    changeTicketCount('minus');
  });
});
