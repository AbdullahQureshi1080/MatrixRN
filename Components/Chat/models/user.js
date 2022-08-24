
export class User {
    id = ""
    avatar = ""
    name = "" 
}

export  const PRESENCE = {
    ONLINE  : "ONLINE",
    OFFLINE : "OFFLINE",
    UNAVAILABLE : "UNAVAILABLE"
}

export class UserPresense {
    userId = ""
    /**@type {PRESENCE} */
    status = null

    lastActive  = 0

    eventId = ""
    
    datetime = new Date()
}