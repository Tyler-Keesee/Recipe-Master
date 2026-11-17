"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../server");

async function withServer(app, exercise) {
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise(resolve => server.once("listening", resolve));
    return await exercise(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test("serves the existing recipe application locally", async () => {
  await withServer(createApp({apiKey: "test-only"}), async url => {
    const response = await fetch(url + "/");
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Recipe Master/);
  });
});

test("requires a server-only API key", async () => {
  await withServer(createApp({apiKey: ""}), async url => {
    const response = await fetch(url + "/api/recipes/complexSearch?query=pasta");
    assert.equal(response.status, 503);
  });
});

test("passes a server-only key upstream, not to browser", async () => {
  let upstreamUrl;
  const fakeFetch = async url => {
    upstreamUrl = url;
    return {ok:true, text:async()=>JSON.stringify({results:[{id:1,title:"Pasta"}]})};
  };
  await withServer(createApp({apiKey:"test-only-private-key",fetchImpl:fakeFetch}), async url => {
    const response = await fetch(url + "/api/recipes/complexSearch?query=pasta&apiKey=attacker");
    assert.equal(response.status,200);
    assert.deepEqual((await response.json()).results, [{id:1,title:"Pasta"}]);
    assert.equal(new URL(upstreamUrl).searchParams.get("apiKey"), "test-only-private-key");
    assert.equal(new URL(upstreamUrl).searchParams.get("query"), "pasta");
  });
});

test("refuses arbitrary upstream proxy paths", async () => {
  await withServer(createApp({apiKey:"test-only"}), async url => {
    assert.equal((await fetch(url + "/api/recipes/../../../etc/passwd")).status, 404);
  });
});

test("blocks rapid repeat requests", async () => {
  let calls=0;
  const fakeFetch=async()=>{calls++;return {ok:true,text:async()=>JSON.stringify({ok:true})}};
  await withServer(createApp({apiKey:"test-only",fetchImpl:fakeFetch}),async url=>{
    const a=await fetch(url+"/api/recipes/random?number=1");
    const b=await fetch(url+"/api/recipes/random?number=1");
    assert.equal(a.status,200);
    assert.equal(b.status,429);
    assert.equal(calls,1);
  });
});
