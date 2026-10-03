# Conoce a tu nuevo Asistente Inteligente (Versión para Principiantes)

¡Bienvenido! Este proyecto es mucho más que un simple "ChatGPT". Lo que tienes aquí es un sistema educativo diseñado para mostrarte cómo la Inteligencia Artificial está evolucionando de ser un simple "oráculo que responde preguntas" a convertirse en un **Agente Autónomo**.

Si no tienes experiencia programando, ¡no te preocupes! Esta guía te explicará los conceptos clave de este proyecto usando analogías muy sencillas.

---

## 1. ¿Qué es un "Agente" de Inteligencia Artificial?

En lugar de solo responder texto (como un chatbot tradicional), un **Agente** es un programa al que se le da un "cerebro" (el modelo de IA) y "manos" (herramientas). 

Cuando le haces una pregunta a este Agente, él no te responde inmediatamente con lo primero que se le ocurre. En su lugar, primero **piensa y planifica**. 
* *"¿Necesito calcular esto?"* -> Usa su herramienta de "Calculadora".
* *"¿Necesito recordar algo sobre este usuario?"* -> Busca en su "Memoria".

**En este proyecto:** Construimos un Agente que tiene estrictamente prohibido inventar respuestas sobre ti. Si le preguntas algo personal, está programado para consultar su archivo de memoria primero. Si no lo sabe, simplemente te dirá "No lo sé".

## 2. ¿Qué es el "MCP" (Model Context Protocol)?

Imagina que el Agente es un chef muy listo en una cocina, pero necesita que alguien le pase los ingredientes que están en la bodega. 

El **MCP** es como un *camarero ultra-rápido y estandarizado*. Es un protocolo (una forma de comunicarse) que permite que cualquier Inteligencia Artificial del mundo se conecte con aplicaciones externas de forma segura. 
En nuestro sistema, usamos el MCP para conectar al "cerebro del Agente" con su "bodega de memoria". ¡El Agente le pide al MCP buscar o guardar recuerdos, y el MCP hace el trabajo pesado por él!

## 3. ¿Cómo funciona su Memoria Inteligente (Vectores y RAG)?

Antiguamente, si un computador quería recordar que *"te gustan los perros"*, guardaría exactamente esas letras. Si luego preguntabas *"¿cuál es mi mascota favorita?"*, el computador fallaría porque las palabras "perro" y "mascota" no son iguales letra por letra.

Para solucionar esto, implementamos algo llamado **Base de Datos Vectorial (LanceDB)**.
En lugar de guardar letras, convertimos tus recuerdos en "conceptos matemáticos" (Vectores). 

Cuando tú le dices:
> *"Tengo alergia al maní"* 
El sistema guarda el *significado* de esa frase.

Si mañana le preguntas:
> *"¿Debería comer esta galleta de mantequilla de cacahuete?"*
El Agente buscará similitudes de **significado** (RAG: Retrieval-Augmented Generation), se dará cuenta de que "cacahuete" y "maní" coinciden conceptualmente en su memoria, ¡y te advertirá que no la comas!

---

## 4. Partes de este Proyecto (Lo que verás en pantalla)

Para que puedas ver todo este proceso "mágico" en tiempo real, hemos construido dos pantallas web (Frontends):

1. **La Pantalla de Chat:** Aquí es donde conversas con el Agente. Lo interesante de esta pantalla es que **verás sus pensamientos**. Antes de responderte, te mostrará unos cartelitos indicando qué herramientas está usando (por ejemplo: `Ejecutando MCP Tool: guardar_si_es_hecho`). Esto te permite entender *cómo* llegó a su conclusión.
2. **La Pantalla de Hechos (La Memoria):** Es un monitor en tiempo real de su "bodega". Si en el chat le dices *"Mi color favorito es el rojo"*, verás cómo mágicamente esa frase aparece en esta segunda pantalla, confirmando que la información se ha guardado permanentemente en su disco duro.

¡Te invitamos a interactuar con él! Carga ambos paneles, ponle a prueba con matemáticas complejas, cuéntale secretos sobre tu vida, y luego hazle preguntas pidiéndole que extraiga conclusiones de lo que le contaste. ¡Disfruta aprendiendo sobre el futuro de la IA!
