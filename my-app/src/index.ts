import { Hono } from 'hono'
import { prettyJSON } from 'hono/pretty-json'
import { Collection, MongoClient } from 'mongodb'

// app setup
const app = new Hono()
app.notFound( c => c.json({ message: 'Endpoint not found', ok: false }, 404))

const middleware = new Hono()
middleware.use('/*', prettyJSON())

const api = new Hono()
const mongo = new MongoClient(process.env.MONGO_URL ?? '')
const getCollection = async (client: MongoClient): Promise<Collection<Document>> => {
				const db = client.db(process.env.MONGO_DB ?? '')
				return Promise.resolve( db.collection(process.env.MONGO_COLLECTION ?? '') )
}

api.get('/names', async ( c ) => {
	// get name that has yes value of true
	return await getCollection(mongo)
		.then( (collection) => collection.find({ yes: true}))
		.then( async (resultsObj) => await resultsObj.toArray())
		.then( (names) => c.json({ names, ok: true}, 200))
		.catch( err => c.json({ error: err, ok: false}, 204))
})

api.get('/getName', async (c) => {
	return await getCollection(mongo)
		.then( async ( collection ) => await collection.aggregate([{ $match: { yes: true}}, { $sample: { size: 1}}]).toArray())
		.then( name => c.json({ name: name[0].name, ok: true}, 200))
		.catch( err => c.json({ name: '', error: err, ok: false}, 204))

})

api.post('/names/yayOrNay', async ( c ) => {
	// accept input from jank reactions and update db accordingly
	const request = await c.req.json()
	return c.json(request)
})

api.post('/names/suggestion', async ( c ) => {
	// take in name suggestion and add it to the db
	const request = await c.req.json()
	return c.json(request)
})

app.route('', middleware)
app.route('', api)

export default app


// this function served its purpose but just wanted to preserve it in case I do something like this again
// api.get('/populate', async (c) => {
// 	const client = new MongoClient(process.env.MONGO_URL ?? '')
// 	const addNames = async (names: Array<string>) => {
// 			return client.connect().then( async () => {
// 				const db = client.db(process.env.MONGO_DB ?? '')
// 				const collection = db.collection(process.env.MONGO_COLLECTION ?? '')
// 				const formattedNames = names.map( name => ({ name, 'yes': true}))
// 				return await collection.insertMany(formattedNames)
// 		}).finally( () => {
// 				return client.close()
// 		})
// 	}
// 	return await Bun.file('assets/omnibus.json').json()
// 		.then(addNames)
// 		.then( () => c.json({ message: 'it finished I guess', ok: true}, 200))
// 		.catch( () => c.json({ message: 'it borked idk', ok: true}, 400))
// })
