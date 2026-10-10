import os

from convex import ConvexClient, ConvexError

client = ConvexClient(os.environ["CONVEX_URL"])
try:
    client.mutation("worker:claimNextRun", {"secret": "definitely-wrong", "workerId": "test"})
except Exception as e:
    assert "Unauthorized worker" in str(e) or isinstance(e, ConvexError), e
    print("ok: wrong secret rejected")
else:
    raise AssertionError("wrong secret was accepted")
