###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM public.ecr.aws/docker/library/node:18.16.0-alpine3.18 As development

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN yarn install --frozen-lockfile

COPY --chown=node:node . .

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM public.ecr.aws/docker/library/node:18.16.0-alpine3.18 As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

RUN yarn run build

ENV NODE_ENV production

RUN yarn install --frozen-lockfile --only=production && yarn cache clean

USER node

###################
# PRODUCTION
###################

FROM public.ecr.aws/docker/library/node:18.16.0-alpine3.18 As production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
EXPOSE 3000

CMD [ "node", "dist/main.js" ]
