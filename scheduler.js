
exports.events = [];

var asArray = (d)=>[d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];

var dateFromArray = (arr)=>new (Function.prototype.bind.apply(Date, [null].concat(arr)));

class ScheduleEvent {
  constructor(cb, date, recur) {
    if(cb && date) this.schedule(cb,date, recur);
  }

  schedule(cb, date, recur){
    this.cb = cb;
    this.next = date;
    this.recur = recur;
    if(this.TO) clearTimeout(this.TO);
    this.TO = setTimeout(()=>{
      if(this.cb) this.cb();
      if(this.recur){
        var nextArr = asArray(this.next).map((item,ind)=>item+(this.recur[ind]||0));
        this.schedule(this.cb,dateFromArray(nextArr), this.recur);
      }
    }, date - Date.now());
    console.log('Event scheduled for ' + this.next.toLocaleString());
  }

  //// this is not perfect, it will permenantly keep the delayed time.
  delay(arr){
    clearTimeout(this.TO);
    var nextArr = asArray(this.next).map((item,ind)=>item+(arr[ind]||0));
    this.schedule(this.cb, dateFromArray(nextArr), this.recur);
  }

  cancel(){
    clearTimeout(this.TO);
    if(exports.events.indexOf(this)>=0){
      exports.events.splice(exports.events.indexOf(this),1);
    }
  }

  cancelNext(){
    clearTimeout(this.TO);
    var nextArr = asArray(this.next).map((item,ind)=>item+(this.recur[ind]||0));
    this.schedule(this.cb,dateFromArray(nextArr),this.recur);
  }

  get timeRemaining() {
    return (this.next > Date.now())? this.next - Date.now() : 0;
  }

}

exports.Event = ScheduleEvent;

exports.nextEvent =()=>exports.events.sort((a,b)=>a.timeRemaining - b.timeRemaining)[0];

var handleWeek = (cb, week)=>{
  var now = new Date();
  week.forEach(entry=>{
    var next = new Date();
    var dayOff = ((now.getDay()-entry[0])%7 + 7)%7;
    next.setDate(now.getDate()+dayOff);
    next.setHours.apply(next,entry.slice(1));
    if(next-now < 0) next.setDate(next.getDate()+7);
    exports.events.push(new ScheduleEvent(cb, next, [0,0,7]));//[0,0,0,0,0,1] one second
  })
}

exports.recurEvent = (cb, schedule)=>{
  for (var key in schedule) {
    if (schedule.hasOwnProperty(key)) {
      switch (key) {
        case "weekly":
          handleWeek(cb, schedule[key]);
          break;
        default:

      }
    }
  }
}

exports.removeEvent = (store)=>{
  clearTimeout(store);
}
