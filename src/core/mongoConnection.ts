import { MongoClient, Collection } from 'mongodb'

const uri = process.env.DB_URL as string;
console.log(uri);
const client = new MongoClient(uri);

const dictionary: { [key: string]: Collection } = {};

const tail = ([dbs, cols, callback, ...xs]: any[]) => xs;

async function runMongoFunction(
    dbString: string,
    collectionString: string,
    callback: (collection: Collection, ...args: any[]) => Promise<any>,
    ...args: any[]
): Promise<any> {
    let results;
    try {
        await client.connect();
        const dbCollectionString = `${dbString}+${collectionString}`;
        let collection: Collection;

        if (!dictionary[dbCollectionString]) {
            const database = client.db(dbString);
            collection = database.collection(collectionString);
            dictionary[dbCollectionString] = collection;
        } else {
            collection = dictionary[dbCollectionString];
        }

        results = await callback(collection, ...args);

    } catch (e) {
        console.error(e);
    }

    return results;
}

export { runMongoFunction };