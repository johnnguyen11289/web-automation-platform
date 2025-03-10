db.auth('webautomation', '123456789')

db = db.getSiblingDB('webautomation')

db.createUser({
  user: 'webautomation',
  pwd: '123456789',
  roles: [
    {
      role: 'readWrite',
      db: 'webautomation'
    }
  ]
}); 