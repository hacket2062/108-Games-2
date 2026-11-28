import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(process.env.RULE_TEST_PACKAGE_JSON);
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc,updateDoc,getDoc,getDocs,collection,query,where,limit,serverTimestamp}=require('firebase/firestore');
if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Emulator required; never run against production');
const env=await initializeTestEnvironment({projectId:'demo-early-grades',firestore:{rules:await readFile('firestore.rules','utf8')}});
let checks=0;const allowed=async p=>{await assertSucceeds(p);checks++;};const denied=async p=>{await assertFails(p);checks++;};
const user=(uid,verified=true)=>env.authenticatedContext(uid,{email_verified:verified}).firestore();
const save=(uid,grade)=>({uid,displayName:'Test learner',level:1,xp:0,coins:520,crystals:20,honorTokens:60,pvpRating:1000,pvpWins:0,pvpLosses:0,grade,semester:'upper',selectedGuardian:'qilin',saveData:{grade,weapons:[{uid:'keep-existing-weapon'}],stageProgress:{chinese_g4_c1_s1:{cleared:true,stars:3}}},createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
try{
 for(const grade of [1,2,3,4,5,6]){
  const uid='learner'+grade,db=user(uid),ref=doc(db,'users',uid);
  await allowed(setDoc(ref,save(uid,grade)));
  await allowed(updateDoc(ref,{grade:grade===6?1:grade+1,updatedAt:serverTimestamp()}));
  const snapshot=await assertSucceeds(getDoc(ref));checks++;
  assert.equal(snapshot.data().saveData.weapons[0].uid,'keep-existing-weapon');
  assert.equal(snapshot.data().saveData.stageProgress.chinese_g4_c1_s1.stars,3);
 }
 for(const grade of [0,-1,7,1.5,'1',null])await denied(setDoc(doc(user('invalid'),'users','invalid'),save('invalid',grade)));
 await denied(setDoc(doc(env.unauthenticatedContext().firestore(),'users','guest'),save('guest',1)));
 await denied(setDoc(doc(user('unverified',false),'users','unverified'),save('unverified',1)));
 await denied(setDoc(doc(user('intruder'),'users','learner1'),save('intruder',1)));
 await denied(getDoc(doc(user('intruder'),'users','learner1')));
 await denied(getDocs(collection(user('learner1'),'users')));
 await denied(updateDoc(doc(user('learner1'),'users','learner1'),{uid:'intruder',updatedAt:serverTimestamp()}));
 await denied(updateDoc(doc(user('learner1'),'users','learner1'),{admin:true,updatedAt:serverTimestamp()}));
 const room=(grade)=>({roomCode:'EARLY'+grade,status:'waiting',grade,subjectFilter:'all',hostUid:'host',hostName:'Test host',hostWeaponPath:'base',hostWeaponLevel:0,hostGuardian:'qilin',hostHp:100,hostScore:0,hostCombo:0,guestUid:'',guestName:'',guestWeaponPath:'base',guestWeaponLevel:0,guestGuardian:'qilin',guestHp:100,guestScore:0,guestCombo:0,winnerUid:'',questionSeed:123,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
 for(const grade of [1,2]){
  await allowed(setDoc(doc(user('host'),'pvpRooms','EARLY'+grade),room(grade)));
  await allowed(getDocs(query(collection(user('visitor'),'pvpRooms'),where('status','==','waiting'),where('grade','==',grade),limit(5))));
 }
 await denied(setDoc(doc(user('host'),'pvpRooms','BADROOM'),room(7)));
 console.log(JSON.stringify({emulator:'demo-early-grades',checks,grades:[1,2,3,4,5,6],ownerProtection:true,inventoryPreserved:true}));
}finally{await env.cleanup();}
