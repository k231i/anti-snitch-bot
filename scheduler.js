const schedule = require("node-schedule");
const EventEmitter = require("events");
const fs = require("fs");
const { config } = require("./config.json");

const offset = config.offset;
const jobs = [];

class Scheduler extends EventEmitter {
  async readJobsFromFile() {
    let jobCache;
    try {
      jobCache = fs.readFileSync("./jobCache.json", "utf-8");
    } catch (error) {
      console.log(error);
    }
    if (jobCache) {
      jobs.push(...JSON.parse(jobCache));
      let i = 0;
      for (const job of jobs) {
        if (job.date > new Date().getTime())
          schedule.scheduleJob(new Date(job.date), () => {
            this.emit("timeToDelete", job.channelId, job.messageId);
            jobs.shift();
          });
        else {
          this.emit("timeToDelete", job.channelId, job.messageId);
          jobs.shift();
          i++;
          if (i >= 50) await new Promise((r) => setTimeout(r, 1000)); //to avoid rate limit
        }
      }
    }
  }

  addMessage(channelId, messageId) {
    let date = new Date(new Date().getTime() + offset);
    schedule.scheduleJob(date, () => {
      this.emit("timeToDelete", channelId, messageId);
      jobs.shift();
    });
    jobs.push({
      date: date.getTime(),
      channelId: channelId,
      messageId: messageId,
    });
  }
}

{
  // save jobs to file every minute
  let rule = new schedule.RecurrenceRule();
  rule.second = 0;
  const fileSaveJob = schedule.scheduleJob(rule, () => {
    fs.writeFile("./jobCache.json", JSON.stringify(jobs), (err) => {
      if (err) console.error(err);
    });
  });
}

module.exports = Scheduler;
