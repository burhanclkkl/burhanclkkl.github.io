/* Küçük ve deterministik öğretici hesaplar; üretim kütüphanelerinin yerine geçmez. */
(() => {
  'use strict';
  const mean = xs => xs.reduce((s,x)=>s+x,0)/xs.length;
  const dist = (a,b) => (a[0]-b[0])**2+(a[1]-b[1])**2;
  const sigmoid = x => 1/(1+Math.exp(-Math.max(-40,Math.min(40,x))));
  const dot = (w,x) => w[0]+w[1]*x[0]+w[2]*x[1];
  const seeded = seed => () => { seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296; };
  const messages = [[.12,.16,0],[.18,.38,0],[.3,.2,0],[.35,.5,0],[.4,.34,0],[.52,.64,1],[.62,.48,1],[.7,.78,1],[.82,.62,1],[.9,.88,1]];
  const houses = [[50,150],[65,180],[80,225],[95,240],[110,290],[125,310]];
  function linear(data) { const mx=mean(data.map(p=>p[0])),my=mean(data.map(p=>p[1]));const slope=data.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0)/data.reduce((s,p)=>s+(p[0]-mx)**2,0);return {slope,intercept:my-slope*mx,predict:x=>my+slope*(x-mx)}; }
  function logistic(data,rounds=1400) { let w=[0,0,0];for(let t=0;t<rounds;t++){const g=[0,0,0];for(const p of data){const e=sigmoid(dot(w,p))-p[2];g[0]+=e/data.length;g[1]+=e*p[0]/data.length;g[2]+=e*p[1]/data.length;}w=w.map((v,i)=>v-.4*(g[i]+(i?.02*v:0)));}return {w,predict:x=>sigmoid(dot(w,x))}; }
  function knn(data,x,k) { const neighbors=data.map((p,i)=>({p,i,d:dist(p,x)})).sort((a,b)=>a.d-b.d||a.i-b.i).slice(0,k);const votes=neighbors.reduce((s,n)=>s+n.p[2],0);return {neighbors,votes,prediction:Number(votes>k/2)}; }
  function bayes(data,x) { const scores=[0,1].map(c=>{const group=data.filter(p=>p[2]===c);let log=Math.log(group.length/data.length);for(let j=0;j<2;j++){const p=(1+group.filter(row=>row[j]>=.5).length)/(2+group.length);log+=Math.log(x[j]>=.5?p:1-p);}return log;});const m=Math.max(...scores),values=scores.map(v=>Math.exp(v-m)),p=values[1]/(values[0]+values[1]);return {p,prediction:Number(p>=.5)}; }
  function svm(data,C=1,rounds=1600) { let w=[0,0,0];const scale=x=>[2*x[0]-1,2*x[1]-1];for(let t=0;t<rounds;t++){const g=[0,w[1],w[2]];for(const p of data){const x=scale(p),y=p[2]?1:-1;if(y*dot(w,x)<1){g[0]-=C*y/data.length;g[1]-=C*y*x[0]/data.length;g[2]-=C*y*x[1]/data.length;}}const rate=.08/(1+t*.002);w=w.map((v,i)=>v-rate*g[i]);}return {w,score:x=>dot(w,scale(x)),predict:x=>Number(dot(w,scale(x))>=0)}; }
  const impurity = rows => {if(!rows.length)return 0;const p=mean(rows.map(r=>r[2]));return 2*p*(1-p);};
  function tree(rows,depth=2,random=null,level=0) {
    const votes=rows.reduce((s,r)=>s+r[2],0),node={prediction:Number(votes>rows.length/2),count:rows.length};
    if(level>=depth||rows.length<2||impurity(rows)===0)return node;
    const features=random?[Math.floor(random()*2)]:[0,1];let best=null;
    for(const f of features){const values=[...new Set(rows.map(r=>r[f]))].sort((a,b)=>a-b);for(let i=1;i<values.length;i++){const threshold=(values[i-1]+values[i])/2,left=rows.filter(r=>r[f]<=threshold),right=rows.filter(r=>r[f]>threshold),cost=(left.length*impurity(left)+right.length*impurity(right))/rows.length;if(!best||cost<best.cost-1e-12)best={f,threshold,left,right,cost};}}
    if(!best||best.cost>=impurity(rows)-1e-12)return node;
    return {...node,f:best.f,threshold:best.threshold,left:tree(best.left,depth,random,level+1),right:tree(best.right,depth,random,level+1)};
  }
  function treePredict(node,x){return node.left?treePredict(x[node.f]<=node.threshold?node.left:node.right,x):node.prediction;}
  function treePath(node,x){const result=[];while(node.left){const left=x[node.f]<=node.threshold;result.push({feature:node.f,threshold:node.threshold,left});node=left?node.left:node.right;}return {steps:result,prediction:node.prediction,count:node.count};}
  function forest(rows,count=7,seed=1){const random=seeded(seed),trees=Array.from({length:count},()=>tree(Array.from({length:rows.length},()=>rows[Math.floor(random()*rows.length)]),3,random));return {trees,votes:x=>trees.map(t=>treePredict(t,x)),predict:x=>Number(trees.reduce((s,t)=>s+treePredict(t,x),0)>count/2)};}
  function stump(data,targets){const values=[...new Set(data.map(p=>p[0]))].sort((a,b)=>a-b);let best=null;for(let i=1;i<values.length;i++){const threshold=(values[i-1]+values[i])/2,l=targets.filter((_,j)=>data[j][0]<=threshold),r=targets.filter((_,j)=>data[j][0]>threshold),lv=mean(l),rv=mean(r),error=targets.reduce((s,y,j)=>s+(y-(data[j][0]<=threshold?lv:rv))**2,0);if(!best||error<best.error)best={threshold,left:lv,right:rv,error};}return best;}
  function boosting(data,rounds=3,rate=.3){const base=mean(data.map(p=>p[1])),trees=[];let predictions=data.map(()=>base);for(let t=0;t<rounds;t++){const fit=stump(data,data.map((p,i)=>p[1]-predictions[i]));trees.push(fit);predictions=predictions.map((v,i)=>v+rate*(data[i][0]<=fit.threshold?fit.left:fit.right));}return {base,trees,predictions,predict:x=>base+rate*trees.reduce((s,t)=>s+(x<=t.threshold?t.left:t.right),0)};}
  const rings = [...Array.from({length:12},(_,i)=>{const t=i/12*Math.PI*2;return [.5+.16*Math.cos(t),.5+.16*Math.sin(t)];}),...Array.from({length:20},(_,i)=>{const t=i/20*Math.PI*2;return [.5+.37*Math.cos(t),.5+.37*Math.sin(t)];}),[.02,.02],[.98,.98]];
  function kmeans(points,k=2,rounds=4){let centers=k===2?[[.25,.25],[.75,.75]]:[[.2,.2],[.8,.2],[.5,.8]];const assign=p=>centers.reduce((best,c,i)=>dist(p,c)<dist(p,centers[best])?i:best,0);for(let t=0;t<rounds;t++){const labels=points.map(assign);centers=centers.map((c,i)=>{const group=points.filter((_,j)=>labels[j]===i);return group.length?[mean(group.map(p=>p[0])),mean(group.map(p=>p[1]))]:c;});}return {centers,labels:points.map(assign)};}
  function dbscan(points,eps=.13,minPts=3){const neighbors=points.map(p=>points.map((q,j)=>dist(p,q)<=eps*eps+1e-12?j:-1).filter(j=>j>=0)),labels=points.map(()=>-2),visited=points.map(()=>false);let groups=0;for(let i=0;i<points.length;i++){if(visited[i])continue;visited[i]=true;if(neighbors[i].length<minPts){labels[i]=-1;continue;}labels[i]=groups;const queue=[...neighbors[i]],queued=new Set(queue);for(let at=0;at<queue.length;at++){const j=queue[at];if(!visited[j]){visited[j]=true;if(neighbors[j].length>=minPts)for(const q of neighbors[j])if(!queued.has(q)){queued.add(q);queue.push(q);}}if(labels[j]<0)labels[j]=groups;}groups++;}return {labels,groups,core:neighbors.map(n=>n.length>=minPts),noise:labels.filter(n=>n===-1).length};}
  const correlated = [[-.8,-.5],[-.6,-.45],[-.35,-.1],[-.15,-.2],[.1,.15],[.4,.25],[.65,.6],[.85,.5]];
  function pca(points,scale=1,angle=null){const data=points.map(p=>[p[0],p[1]*scale]),center=[mean(data.map(p=>p[0])),mean(data.map(p=>p[1]))],z=data.map(p=>[p[0]-center[0],p[1]-center[1]]),a=mean(z.map(p=>p[0]**2)),b=mean(z.map(p=>p[0]*p[1])),c=mean(z.map(p=>p[1]**2)),optimal=.5*Math.atan2(2*b,a-c),theta=angle===null?optimal:angle,axis=[Math.cos(theta),Math.sin(theta)],scores=z.map(p=>p[0]*axis[0]+p[1]*axis[1]),variance=mean(scores.map(v=>v*v));return {data,center,z,optimal,theta,axis,scores,projected:scores.map(v=>[v*axis[0],v*axis[1]]),fraction:variance/(a+c),total:a+c};}
  function categoryStats(records,ordered=true){return records.map((row,i)=>{const group=records.filter((r,j)=>r.category===row.category&&(!ordered||j<i));return (.5+group.reduce((s,r)=>s+r.y,0))/(1+group.length);});}
  window.ClassicML = Object.freeze({mean,dist,sigmoid,dot,seeded,messages,houses,linear,logistic,knn,bayes,svm,tree,treePredict,treePath,forest,boosting,rings,kmeans,dbscan,correlated,pca,categoryStats});
})();
