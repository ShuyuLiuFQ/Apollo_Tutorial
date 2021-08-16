require('dotenv').config();
const {ApolloServer} = require('apollo-server');
const typeDefs = require('./schema');
const {createStore} = require('./utils');
const resolvers = require('./resolvers');
const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');
const isEmail = require('isemail');

// set up our SQLite database
const store = createStore();

const server = new ApolloServer({
    context: async ({req}) => {
        const auth = req.headers && req.headers.authorization || '';
        const email = Buffer.from(auth, 'base64').toString('ascii'); // decode
        if(!isEmail.validate(email)) return {user:null};
        const users = await store.users.findOrCreate({where: {email}});
        const user = users && users[0] || null;
        return {user : {...user.dataValues}};
    },
    typeDefs,
    resolvers, // dataSources here is invoked by the resolvers
    dataSources: () => ({
        launchAPI: new LaunchAPI(),
        userAPI: new UserAPI({store})
    })

});
server.listen().then(() => {
    console.log(`
    server is running!
    listening on port 4000
    explore at https://studio.apollographql.com/sandbox`);
});
