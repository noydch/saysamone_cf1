const { Queue, Worker } = require('bullmq');
const processComment = require('../services/commentProcessor');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

// Create the Queue
const commentQueue = new Queue('commentProcessing', { connection });

// Initialize Worker
const initWorker = (io) => {
  const worker = new Worker('commentProcessing', async (job) => {
    // Process each comment
    const result = await processComment(job.data, io);
    return result;
  }, { connection });

  worker.on('completed', (job, returnvalue) => {
    // console.log(`Job completed with id ${job.id}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Job failed with id ${job.id}:`, error);
  });

  return worker;
};

// Function to add a comment to queue
const addCommentToQueue = async (commentData) => {
  await commentQueue.add('process-comment', commentData);
};

module.exports = { addCommentToQueue, initWorker };
