import { MessageType } from './message.type';
import { User } from './user';

export class Message {
  id = '';
  message = '';
  datetime = String(new Date().toISOString());

  /** @type {User} */
  from = null; // from null mean the current user

  room = '';
  /** @type {MessageType} */
  messageType = MessageType.NOTFOUND;
  read = false;
}

export class TextMessage extends Message {
  messageType = MessageType.TEXT;
}

export class InfoMessage extends Message {
  messageType = MessageType.INFO;
}

export class ImageMessage extends Message {
  messageType = MessageType.IMAGE;
  filename = '';
  height = 0;
  width = 0;
  mimetype = '';
  size = 0;
  url = '';
}

export class AudioMessage extends Message {
  messageType = MessageType.IMAGE;
  filename = '';
  mimetype = '';
  size = 0;
  url = '';
  duration = 0;
}

export class FileMessage extends Message {
  messageType = MessageType.FILE;
  filename = '';
  mimetype = '';
  size = 0;
  url = '';
}

export class VideoMessage extends Message {
  messageType = MessageType.VIDEO;
  filename = '';
  height = 0;
  width = 0;
  mimetype = '';
  size = 0;
  url = '';
  duration = 0;
  thumbnailHeight = 0;
  thumbnailWidth = 0;
  thumbnailSize = 0;
  thumbnailMimetype = 0;
  thumbnailUrl = 0;
}
