const eventEmitter=require('events').EventEmitter

const SerialPort = require('serialport')
const parsers = SerialPort.parsers

class ArduinoCom extends eventEmitter.EventEmitter{

    constructor(device, speed) {
        super()

        this.device=device

        this.donnees = {
            temperature: 0,
            humidite: 0,
            pression: 0,
            eclairement: 0
        }
        //
        this.tableauMessages = ['/temperature/', '/pression/', '/humidite/', '/eclairement/', 'stateLed/']
        this.indice = 0
        this.handle = 0
        //
        this.parser = new parsers.Readline({
            delimiter: '\r\n'
        })
        //
        this.serial = new SerialPort(device, {
            baudRate: speed
        })
        //
        this.serial.pipe(this.parser)
        //
        this.serial.on('open', () => {

            console.log('Serial Port '+this.device+' Open')
            this.handle=setInterval(() => {
                this.envoyerMessage()
            }, 2000)
        })
        //
        this.parser.on('data', (datas) => {
            this.receptionMessage(datas)
        })
    }
    //
    envoyerMessage() {
        let msg = this.tableauMessages[this.indice] + '\n\r'
        this.serial.write(msg)
        this.indice += 1

        if (this.indice >= this.tableauMessages.length) {
            this.indice = 0
        }
    }
    //
    receptionMessage(msg) {
        //console.log(msg)
        var res = undefined

        res = JSON.parse(msg)

        if (res != undefined) {
            //
            if (res.temperature != undefined) {
                this.donnees.temperature = res.temperature
                this.emit("donnees",this.donnees)
                return
            }
            //
            if (res.pression != undefined) {
                this.donnees.pression = res.pression
                this.emit("serialDatas",this.donnees)
                return
            }
            //
            if (res.humidite != undefined) {
                this.donnees.humidite = res.humidite
                this.emit("serialDatas",this.donnees)
                return
            }
            //
            if (res.eclairement != undefined) {
                this.donnees.eclairement = res.eclairement
                this.emit("serialDatas",this.donnees)
                return
            }
        }
    }
    //
    getDatas() {
        return this.donnees
    }

    //
    stopDatas(){
        clearInterval(this.handle)
    }
}
//fin class
//
exports.connect = function(device, speed) {
    return new ArduinoCom(device, speed)
}
