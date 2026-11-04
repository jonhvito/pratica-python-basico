"""Soluções sintéticas de verificação, fora dos arquivos publicados."""
base = '''
def sinal(x):
    if x > 0: return "+"
    if x < 0: return "-"
    return "0"
def sinal_vec(valores):
    return [sinal(x) for x in valores]
def fatorial(n):
    if n < 0: return None
    produto = 1
    for i in range(2, n + 1): produto *= i
    return produto
'''
solucoes = {
"1": "def sinal(x):\n    if x > 0: return '+'\n    if x < 0: return '-'\n    return '0'",
"2a": "def sinal_vec(valores):\n    return [sinal(x) for x in valores]",
"2b": "def conta_sinais(valores):\n    contagem = {'+':0, '-':0, '0':0}\n    for sinal_atual in sinal_vec(valores): contagem[sinal_atual] += 1\n    return contagem",
"3a": "def bissexto(ano):\n    return (ano % 4 == 0 and ano % 100 != 0) or ano % 400 == 0",
"4b": "def soma_pares(a,b):\n    inicio = a + a % 2\n    return sum(range(inicio,b+1,2))",
"4c": "def contagem_regressiva(n):\n    for i in range(n,0,-1): print(i)\n    print('Fim')",
"6a": "def tree(n):\n    for i in range(1,n+1): print('*' * i)",
"6b": "def tree(n):\n    for i in range(1,n+1):\n        for j in range(i): print('*',end='')\n        print()",
"6c": "def tree_inv(n):\n    for i in range(n,0,-1): print('*' * i)",
"6d": "def tree(n):\n    i=1\n    while i<=n:\n        print('*'*i)\n        i+=1",
"7a": "def tree_alt(n):\n    for i in range(1,n+1):\n        linha=''\n        for j in range(1,i+1): linha += '*' if j%2 else '-'\n        print(linha)",
"7b": "def tree_alt(n,impar='*',par='-'):\n    for i in range(1,n+1):\n        linha=''\n        for j in range(1,i+1): linha += impar if j%2 else par\n        print(linha)",
"7c": "def tree_alt(n):\n    for i in range(1,n+1): print(('*-'*n)[:i])",
"8a": "def fatorial(n):\n    if n<0: return None\n    p=1\n    for i in range(2,n+1): p*=i\n    return p",
"8b": "def fatorial_while(n):\n    if n<0: return None\n    p=1\n    while n>1:\n        p*=n\n        n-=1\n    return p",
"9a": "def soma_geometrica(x,n):\n    return sum(x**k for k in range(n+1))",
"10a": "def exp_aprox(x,n):\n    return sum(x**k/fatorial(k) for k in range(n+1))",
"10c": "def exp_rapida(x,n):\n    termo=1.0\n    total=termo\n    for k in range(1,n+1):\n        termo*=x/k\n        total+=termo\n    return total",
"11a": "def seno(x,tol=1e-10):\n    k=0\n    total=0\n    while True:\n        termo=(-1)**k*x**(2*k+1)/fatorial(2*k+1)\n        if abs(termo)<tol: break\n        total+=termo\n        k+=1\n    return total,k",
"12a": "def eh_primo(n):\n    if n<2: return False\n    primo=True\n    for d in range(2,n):\n        if n%d==0:\n            primo=False\n            break\n    return primo",
"12b": "def eh_primo(n):\n    if n<2: return False\n    primo=True\n    for d in range(2,int(n**0.5)+1):\n        if n%d==0:\n            primo=False\n            break\n    return primo",
"12c": "def primos_ate(n):\n    return [x for x in range(2,n+1) if all(x%d for d in range(2,x))]",
"13a": "def media_valida(dados):\n    soma=0\n    validos=0\n    descartados=0\n    for v in dados:\n        if v is None or v<0:\n            descartados+=1\n            continue\n        soma+=v\n        validos+=1\n    return (soma/validos if validos else None,descartados)",
"13c": "def media_valida(dados):\n    soma=0\n    validos=0\n    descartados=0\n    for v in dados:\n        if v is None or v<0: descartados+=1\n        else:\n            soma+=v\n            validos+=1\n    return (soma/validos if validos else None,descartados)",
"14a": "def passos_collatz(n):\n    passos=0\n    while n!=1:\n        n=n//2 if n%2==0 else 3*n+1\n        passos+=1\n    return passos",
"14b": "def sequencia_collatz(n):\n    r=[n]\n    while n!=1:\n        n=n//2 if n%2==0 else 3*n+1\n        r.append(n)\n    return r",
"15a": "def soma_digitos(n):\n    s=0\n    while n>0:\n        s+=n%10\n        n//=10\n    return s",
"15b": "def inverte(n):\n    r=0\n    while n>0:\n        r=r*10+n%10\n        n//=10\n    return r",
"15c": "def inverte(n):\n    r=0\n    while n>0:\n        r=r*10+n%10\n        n//=10\n    return r\ndef eh_capicua(n):\n    return n==inverte(n)",
"15d": "def quantos_digitos(n):\n    total=0\n    while n>0:\n        total+=1\n        n//=10\n    return total",
"16a": "def frequencias(lista):\n    r={}\n    for item in lista: r[item]=r.get(item,0)+1\n    return r",
"16b": "def imprime_tabela(freq):\n    total=sum(freq.values())\n    print('Categoria Abs. Rel. %')\n    for categoria, qtd in freq.items():\n        rel=qtd/total\n        print(f'{categoria} {qtd} {rel:.2f} {100*rel:.1f}%')",
"16c": "def moda(freq):\n    maior=-1\n    resultado=None\n    for categoria,qtd in freq.items():\n        if qtd>maior: maior,resultado=qtd,categoria\n    return resultado",
"17a": "def boletim(notas):\n    resultado={}\n    for nome,ns in notas.items():\n        media=sum(ns)/len(ns)\n        situacao='Aprovado' if media>=7 else 'Prova final' if media>=4 else 'Reprovado'\n        resultado[nome]=(round(media,2),situacao)\n    return resultado",
"18a": "def produto_interno(x,y):\n    if len(x)!=len(y): return None\n    return sum(a*b for a,b in zip(x,y))",
"18b": "def covariancia(x,y):\n    mx=sum(x)/len(x)\n    my=sum(y)/len(y)\n    return sum((a-mx)*(b-my) for a,b in zip(x,y))/(len(x)-1)",
"18c": "def posicoes_do_maximo(valores):\n    maior=max(valores)\n    return [i for i,v in enumerate(valores) if v==maior]",
"19a": "def pares_soma(valores,alvo):\n    pares=[]\n    for i in range(len(valores)):\n        for j in range(i+1,len(valores)):\n            if valores[i]+valores[j]==alvo: pares.append((valores[i],valores[j]))\n    return pares",
"19c": "def eh_palindromo(texto):\n    t=texto.lower().replace(' ','')\n    i,j=0,len(t)-1\n    valido=True\n    while i<j:\n        if t[i]!=t[j]:\n            valido=False\n            break\n        i+=1\n        j-=1\n    return valido",
"19d": "def fibonacci(n):\n    a,b=0,1\n    r=[]\n    for i in range(n):\n        r.append(a)\n        a,b=b,a+b\n    return r",
"20c": "def resumo(dados, /, casas=2, *, medida='media'):\n    if medida=='media': valor=sum(dados)/len(dados)\n    elif medida=='amplitude': valor=max(dados)-min(dados)\n    elif medida=='mediana':\n        s=sorted(dados)\n        n=len(s)\n        valor=s[n//2] if n%2 else (s[n//2-1]+s[n//2])/2\n    else: return None\n    return round(valor,casas)",
}
solucoes["20d"] = solucoes["20c"].replace("casas=2, *, medida", "*, casas=2, medida")
