// this is a general event scheduler library. It will automatically manage
// the timeouts needed to call a callback on a regular schedule.

exports.events = [];

//turn a Date object into an array object.
var asArray = (d)=>[d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];

//create a Date object from an array.
var dateFromArray = (arr)=>new (Function.prototype.bind.apply(Date, [null].concat(arr)));

class ScheduleEvent {
  //define the constructor for the new event. Takes a callback, a date object,
  //and an array representing how often the event should recur.
  constructor(cb, date, recur) {
    if (cb && date) this.schedule(cb, date, recur);
  }

  //define the member function that is used to do the scheduling.
  schedule(cb, date, recur) {
    this.cb = cb;
    this.next = date;
    this.recur = recur;
    //if timer is running, clear it
    if (this.TO) clearTimeout(this.TO);
    this.TO = setTimeout(()=> {
      if (this.cb) this.cb();
      if (this.recur) {
        // set it to recur after the next instance
        var nextArr = asArray(this.next).map((item, ind)=>item + (this.recur[ind] || 0));
        this.schedule(this.cb, dateFromArray(nextArr), this.recur);
      }
    }, date - Date.now());
    console.log('Event scheduled for ' + this.next.toLocaleString());
  }

  //// this is not perfect, it will permenantly keep the delayed time, but doesn't matter for shutdowns
  delay(arr) {
    clearTimeout(this.TO);
    var nextArr = asArray(this.next).map((item, ind)=>item + (arr[ind] || 0));
    this.schedule(this.cb, dateFromArray(nextArr), this.recur);
  }

  //set only the time, not the date.
  setTime(arr) {
    clearTimeout(this.TO);
    this.next.setHours.apply(this.next, arr);
    this.schedule(this.cb, this.next, this.recur);
  }

  // stop the event, and all recurrences.
  cancel() {
    clearTimeout(this.TO);
    if (exports.events.indexOf(this) >= 0) {
      exports.events.splice(exports.events.indexOf(this), 1);
    }
  }

  //only cancel the next
  cancelNext() {
    clearTimeout(this.TO);
    var nextArr = asArray(this.next).map((item, ind)=>item + (this.recur[ind] || 0));
    this.schedule(this.cb, dateFromArray(nextArr), this.recur);
  }

  // find out how much time remains before the next occurance.
  get timeRemaining() {
    return (this.next > Date.now()) ? this.next - Date.now() : 0;
  }

}

exports.Event = ScheduleEvent;

//find the next scheduled event.
exports.nextEvent = ()=> {
  exports.events.sort((a, b)=>a.timeRemaining - b.timeRemaining);
  console.log(exports.events[0]);
  return exports.events[0];
};

// parse the recurrance schedule for a weekly recurrance
var handleWeek = (cb, week)=>{
  var now = new Date();
  week.forEach(entry=>{
    var next = new Date();
    var dayOff = ((entry[0]-now.getDay())%7 + 7)%7;
    next.setDate(now.getDate()+dayOff);
    next.setHours.apply(next,entry.slice(1));
    if(next-now < 0) next.setDate(next.getDate()+7);
    exports.events.push(new ScheduleEvent(cb, next, [0,0,7]));//[0,0,0,0,0,1] one second
  })
}

// make a function to setup recurring events.
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
