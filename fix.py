c=open('index.html').read();c=c.replace('a.groomerId===staffId','a.groomerId==staffId');open('index.html','w').write(c);print('done')
