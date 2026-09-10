import test from 'node:test'
import assert from 'node:assert/strict'
import { reportGraphDimensions, reportImageJpeg } from '../src/features/sales/reportGraphImage.ts'
import { prepareReportPhotoImages } from '../src/features/sales/reportPhotoImages.ts'

test('report images bound both orientations without enlarging originals', () => {
  assert.deepEqual(reportGraphDimensions(4000,4000), {width:2000,height:2000})
  assert.deepEqual(reportGraphDimensions(4000,3000), {width:2000,height:1500})
  assert.deepEqual(reportGraphDimensions(3000,4000), {width:1500,height:2000})
  assert.deepEqual(reportGraphDimensions(400,300), {width:400,height:300})
  assert.throws(() => reportGraphDimensions(0,2))
})
test('report conversion uses white bounded JPEG and releases decoded image', async () => {
  const priorBitmap=globalThis.createImageBitmap, priorDocument=globalThis.document
  const calls=[]; let closed=false
  const context={fillStyle:'',fillRect(...args){calls.push(['fill',this.fillStyle,...args])},drawImage(...args){calls.push(['draw',...args.slice(1)])}}
  const canvas={getContext:()=>context,toBlob(cb,type,quality){calls.push(['encode',type,quality]);cb(new Blob(['jpeg'],{type}))}}
  globalThis.createImageBitmap=async()=>({width:4000,height:4000,close(){closed=true}})
  globalThis.document={createElement:()=>canvas}
  try {
    const original=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'})
    const result=await reportImageJpeg(original)
    assert.equal(result.type,'image/jpeg'); assert.equal(original.type,'image/png');assert.equal(original.size,8)
    assert.equal(canvas.width,2000);assert.equal(canvas.height,2000);assert.equal(closed,true)
    assert.deepEqual(calls,[['fill','#ffffff',0,0,2000,2000],['draw',0,0,2000,2000],['encode','image/jpeg',0.92]])
    await assert.rejects(reportImageJpeg(new Blob(['bad'],{type:'image/png'})),/could not be read/)
  } finally {globalThis.createImageBitmap=priorBitmap;globalThis.document=priorDocument}
})
const photo=(id,key=`sales-brain/photos/q/${id}`)=>({id,source:'sales-brain',storageKey:key})
test('report derivatives reuse exact originals and process remaining images sequentially',async()=>{
  const photos=[photo('a'),photo('b'),photo('c'),{...photo('hidden'),customerVisible:false},{...photo('graph'),source:'graph'}]
  const existing={photoId:'a',sourceStorageKey:photos[0].storageKey,storageKey:'sales-brain/photos/q/derived-a'}
  const inspection={id:'q',photos,workflowData:{reportPhotoImages:[existing,{photoId:'b',sourceStorageKey:'old',storageKey:'sales-brain/photos/q/old'}]}}
  const before=JSON.stringify(inspection),calls=[];let count=0
  const result=await prepareReportPhotoImages(inspection,{assertCurrent(){},async load(p){calls.push(`load:${p.id}`);return new Blob([p.id])},async convert(b){calls.push(`convert:${await b.text()}`);return new Blob(['jpeg'],{type:'image/jpeg'})},async upload(f){calls.push('upload');assert.equal(f.type,'image/jpeg');return {storageKey:`sales-brain/photos/q/new-${++count}`}}})
  assert.deepEqual(calls,['load:b','convert:b','upload','load:c','convert:c','upload'])
  assert.equal(result[0],existing);assert.equal(result.length,3);assert.equal(JSON.stringify(inspection),before)
})
test('report preparation stops on edits before uploading and rejects foreign derivative destinations',async()=>{
  let checks=0,uploads=0
  const tools={assertCurrent(){if(++checks===2)throw Error('Work changed')},async load(){return new Blob()},async convert(){return new Blob()},async upload(){uploads++;return {storageKey:'sales-brain/photos/other/x'}}}
  await assert.rejects(prepareReportPhotoImages({id:'q',photos:[photo('a')]},tools),/Work changed/)
  assert.equal(uploads,0)
  await assert.rejects(prepareReportPhotoImages({id:'q',photos:[photo('a')]},{...tools,assertCurrent(){}}),/could not be saved/)
})
test('legacy photos with own storage keys receive report copies without touching graph photos', async()=>{
  let loads=0
  const result=await prepareReportPhotoImages({id:'q',photos:[{id:'legacy',storageKey:'sales-brain/photos/q/legacy'},{id:'graph',storageKey:'sales-brain/photos/q/graph',sourceGraphKey:'graph-key'},{id:'foreign',storageKey:'sales-brain/photos/other/photo'}]}, {assertCurrent(){},async load(){loads++;return new Blob()},async convert(){return new Blob(['jpeg'],{type:'image/jpeg'})},async upload(){return {storageKey:'sales-brain/photos/q/report'}}})
  assert.equal(loads,1);assert.equal(result[0].photoId,'legacy');assert.equal(result.length,1)
})
