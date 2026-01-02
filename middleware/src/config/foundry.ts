import { type Client, createClient } from "@osdk/client";
import { createConfidentialOauthClient } from "@osdk/oauth";
import dotenv from "dotenv";

dotenv.config();

const client_id: string = process.env.CLIENT_ID!;
const url: string = "https://magic.usw-3.palantirfoundry.com";
const ontologyRid: string = "ri.ontology.main.ontology.79dee872-8094-4fe0-8a82-93d1488a2294";
const client_secret = process.env.CLIENT_SECRET!;

// Mock localStorage for Node.js environment
(global as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
};

const auth = createConfidentialOauthClient(client_id, client_secret, url, undefined, (url, options) =>
    fetch(url, { ...options, cache: undefined } as RequestInit)
);

export const client: Client = createClient(url, ontologyRid, auth);
