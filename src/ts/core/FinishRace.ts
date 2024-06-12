import { World } from "../sketchbook";
import { mySid } from "../socket/socket";
export function OnFinishRace(count: any, time_:String, id:String, name:String, world: World, timeOut: boolean){
    const finishPage = document.getElementById('GameFinish'); 
    if(mySid == id){
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
            text1.textContent = "02:00:00  Race Length";
            text2.textContent = "00:00:00  Elaspsed Time";
        }   
        else{
            text1.textContent = "00:00:00  Race Length";
            text2.textContent = time_.toString();
        }
        finishPage.style.display = 'flex'; 
        const rankElement = document.getElementById('RankNumber');
        rankElement.textContent = "Rank #" + count;
        if (timeOut) rankElement.textContent = "Rank #" + 'NONE';
    }
                                       
    const finalTable = document.getElementById('GameFinishTable');
    if (finalTable) {
        let childIndex = count;
        if (childIndex === 0) childIndex ++;
        const player = finalTable.querySelector('tbody tr:nth-child('+ childIndex +')');
        const name_ = player.querySelector('tbody td:nth-child(1)');
        const rank = player.querySelector('tbody td:nth-child(2)');
        const time = player.querySelector('tbody td:nth-child(3)');
        name_.textContent = name.toString();
        rank.textContent = "Rank " + count;
        if (timeOut) rank.textContent = "Rank " + 'NONE';
        let newStr = time_.replace(new RegExp('\\b' + "Elaspsed Time" + '\\b', 'gi'), '');
        time.textContent = "Finish Time: " + newStr; 
    }

    // Disable button
    if (world.players.length > 0) {
        if (count === world.players.length) {
            let raceAgainButton = <HTMLInputElement> document.getElementById('btn-raceAgain');
            if (raceAgainButton) {
                raceAgainButton.disabled = false;
                raceAgainButton.addEventListener('click', () => {
                    window.location.reload();
                })
            }
        }
    }

    if (timeOut) {
        let raceAgainButton = <HTMLInputElement> document.getElementById('btn-raceAgain');
        if (raceAgainButton) {
            raceAgainButton.disabled = false;
            raceAgainButton.addEventListener('click', () => {
                window.location.reload();
            })
        }
    }
}